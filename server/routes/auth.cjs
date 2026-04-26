/**
 * UCAR Auth Routes — Google SSO
 *
 * Replaces the old email/password + OTP system with
 * Google Identity Services (One Tap / Sign-in with Google).
 *
 * Flow:
 *   1. Frontend receives a Google credential (JWT) from the GIS library
 *   2. POST /api/auth/google  →  server verifies the JWT with Google
 *   3. If user exists + approved → issue UCAR access & refresh tokens
 *   4. If user is unknown       → return {needs_registration: true}
 *   5. POST /api/auth/google/register → complete profile & set role
 */

const express  = require('express');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');

const { getDb }                              = require('../db.cjs');
const { authenticateToken, requireRole, JWT_SECRET } = require('../middleware/auth.cjs');

const router = express.Router();

// ── Google Client ID ─────────────────────────────────────────────────────────
// Set GOOGLE_CLIENT_ID in your .env file
// Get it from: https://console.cloud.google.com/ → APIs & Services → Credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '477350247068-1avukeg5pis4qs1hpkpf3cuc31ua9vhl.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── Helper: build UCAR token pair ────────────────────────────────────────────
function issueTokens(user) {
  const accessToken = jwt.sign(
    {
      userId:        user.id,
      email:         user.email,
      role:          user.role_name,
      institutionId: user.institution_id,
    },
    JWT_SECRET,
    { expiresIn: '24h' },
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
}

// ── Helper: verify Google credential ─────────────────────────────────────────
async function verifyGoogleToken(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken:  credential,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload(); // { sub, email, name, given_name, family_name, picture }
}

/* ==========================================================
   POST /api/auth/google
   Verify Google token → login or signal new user
========================================================== */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential manquant.' });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(credential);
    } catch {
      return res.status(401).json({ error: 'Token Google invalide ou expiré.' });
    }

    const { sub: googleId, email, name, given_name, family_name, picture } = payload;
    const db = getDb();

    // Look for existing user by google_id or email
    const user = db.prepare(`
      SELECT u.id, u.email, u.nom, u.prenom, u.google_id,
             u.institution_id, u.approval_status,
             r.role_name, i.institution_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN institutions i ON i.id = u.institution_id
      WHERE u.google_id = ? OR LOWER(u.email) = LOWER(?)
    `).get(googleId, email);

    // ── Case 1: User exists ───────────────────────────────────────────────
    if (user) {
      // Link google_id if signing in via email match for the first time
      if (!user.google_id) {
        db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
      }

      if (user.approval_status === 'pending') {
        return res.status(403).json({
          error: "Votre compte est en attente d'approbation par l'administration.",
          code:  'PENDING_APPROVAL',
        });
      }
      if (user.approval_status === 'rejected') {
        return res.status(403).json({ error: 'Compte refusé.', code: 'REJECTED' });
      }

      const { accessToken, refreshToken } = issueTokens(user);
      const avatarInitials = `${(user.prenom || given_name || 'U')[0]}${(user.nom || family_name || 'C')[0]}`.toUpperCase();

      console.log(`[Auth] ✅ Google login: ${email}`);
      return res.json({
        success:       true,
        access_token:  accessToken,
        refresh_token: refreshToken,
        user: {
          id:              user.id,
          name:            `${user.prenom} ${user.nom}`,
          email:           user.email,
          role:            user.role_name,
          institutionId:   user.institution_id,
          institutionName: user.institution_name,
          avatarInitials,
          picture,
        },
      });
    }

    // ── Case 2: New user — needs to complete registration ─────────────────
    console.log(`[Auth] 🆕 Unknown Google user: ${email} — needs registration`);
    return res.status(200).json({
      success:           false,
      needs_registration: true,
      google_profile: {
        google_id:   googleId,
        email,
        name,
        given_name,
        family_name,
        picture,
      },
    });

  } catch (err) {
    console.error('[Auth] Google login error:', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/* ==========================================================
   POST /api/auth/google/register
   Complete registration for a new Google-authenticated user.
   Body: { google_id, email, given_name, family_name, institution_id, role_name }
========================================================== */
router.post('/google/register', async (req, res) => {
  try {
    const { google_id, email, institution_id, role_name } = req.body;
    let { given_name, family_name, name: fullName } = req.body;

    // Gracefully derive names if Google didn't split them
    if (!given_name && !family_name && fullName) {
      const parts = fullName.trim().split(' ');
      given_name  = parts[0];
      family_name = parts.slice(1).join(' ') || parts[0]; // fallback to same if single name
    } else if (!given_name)  { given_name  = family_name || 'Utilisateur'; }
      else if (!family_name) { family_name = given_name; }

    if (!google_id || !email || !institution_id) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const db = getDb();

    // Guard: already registered?
    const existing = db.prepare('SELECT id FROM users WHERE google_id = ? OR LOWER(email) = LOWER(?)').get(google_id, email);
    if (existing) {
      return res.status(409).json({ error: 'Ce compte Google est déjà enregistré.' });
    }

    const institution = db.prepare('SELECT id FROM institutions WHERE id = ?').get(institution_id);
    if (!institution) {
      return res.status(400).json({ error: 'Institution non trouvée.' });
    }

    const requestedRole = role_name || 'student';
    const role = db.prepare('SELECT id FROM roles WHERE role_name = ?').get(requestedRole);
    if (!role) {
      return res.status(400).json({ error: 'Rôle invalide.' });
    }

    const userId   = uuidv4();
    const username = `${given_name.toLowerCase()}.${family_name.toLowerCase()}.${userId.slice(0, 4)}`;

    db.prepare(`
      INSERT INTO users (
        id, username, nom, prenom, email, google_id,
        institution_id, role_id,
        email_verified, approval_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending')
    `).run(userId, username, family_name, given_name, email.toLowerCase(), google_id, institution_id, role.id);

    console.log(`[Auth] ✅ Registered new user via Google: ${email} (pending approval)`);

    return res.status(201).json({
      success: true,
      message: "Inscription réussie. Votre compte est en attente d'approbation.",
    });

  } catch (err) {
    console.error('[Auth] Google register error:', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/* ==========================================================
   GET /api/auth/me   — return current user from JWT
========================================================== */
router.get('/me', authenticateToken, (req, res) => {
  const db   = getDb();
  const user = db.prepare(`
    SELECT u.id, u.email, u.nom, u.prenom, u.institution_id,
           r.role_name, i.institution_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    JOIN institutions i ON i.id = u.institution_id
    WHERE u.id = ?
  `).get(req.user.userId);

  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

  const avatarInitials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
  return res.json({
    id:              user.id,
    name:            `${user.prenom} ${user.nom}`,
    email:           user.email,
    role:            user.role_name,
    institutionId:   user.institution_id,
    institutionName: user.institution_name,
    avatarInitials,
  });
});

/* ==========================================================
   POST /api/auth/logout — stateless; just a signal for the client
========================================================== */
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Déconnecté.' });
});

/* ==========================================================
   Admin: GET /api/auth/pending-users
========================================================== */
router.get('/pending-users', authenticateToken, requireRole('ucar_admin'), (req, res) => {
  const db    = getDb();
  const users = db.prepare(`
    SELECT u.id, u.prenom, u.nom, u.email, u.created_at,
           r.role_name, i.institution_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    JOIN institutions i ON i.id = u.institution_id
    WHERE u.approval_status = 'pending'
    ORDER BY u.created_at ASC
  `).all();
  return res.json({ pending: users });
});

/* ==========================================================
   Admin: POST /api/auth/approve-user
========================================================== */
router.post('/approve-user', authenticateToken, requireRole('ucar_admin'), (req, res) => {
  const { user_id, action } = req.body; // action: 'approved' | 'rejected'
  if (!user_id || !['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'user_id et action (approved|rejected) requis.' });
  }

  const db = getDb();
  db.prepare('UPDATE users SET approval_status = ?, approved_by = ? WHERE id = ?')
    .run(action, req.user.userId, user_id);

  return res.json({ success: true, message: `Compte ${action}.` });
});

module.exports = router;