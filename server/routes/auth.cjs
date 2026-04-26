/**
 * UCAR Auth Routes
 * Handles:
 * - register
 * - verify-email
 * - login (step 1)
 * - verify-otp (step 2)
 * - approve-user
 * - pending-users
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { getDb } = require("../db.cjs");
const { authenticateToken, requireRole, JWT_SECRET } = require("../middleware/auth.cjs");
const { sendOtpEmail } = require("../services/email.cjs");

const router = express.Router();

/* ==========================================================
   REGISTER
========================================================== */
router.post("/register", (req, res) => {
  try {
    const {
      username, nom, prenom, email,
      telephone, password, institution_id, role_name,
    } = req.body;

    if (!username || !nom || !prenom || !email || !telephone || !password || !institution_id) {
      return res.status(400).json({
        error: "Tous les champs sont obligatoires, y compris le numéro de téléphone.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Format d'email invalide." });
    }

    // Validate E.164 phone format
    const phoneRegex = /^\+\d{8,15}$/;
    if (!phoneRegex.test(telephone)) {
      return res.status(400).json({
        error: "Numéro de téléphone invalide. Utilisez le format international (+216XXXXXXXX).",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      });
    }

    const db = getDb();

    const existingUser = db
      .prepare("SELECT id FROM users WHERE LOWER(email)=LOWER(?) OR LOWER(username)=LOWER(?)")
      .get(email, username);

    if (existingUser) {
      return res.status(409).json({ error: "Cet email ou nom d'utilisateur est déjà utilisé." });
    }

    const institution = db
      .prepare("SELECT id FROM institutions WHERE id = ?")
      .get(institution_id);

    if (!institution) {
      return res.status(400).json({ error: "Institution non trouvée." });
    }

    const requestedRole = role_name || "student";
    const role = db.prepare("SELECT id FROM roles WHERE role_name = ?").get(requestedRole);

    if (!role) {
      return res.status(400).json({ error: "Rôle invalide." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (
        id, username, nom, prenom, email, telephone,
        password_hash, institution_id, role_id,
        email_verified, approval_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')
    `).run(
      userId,
      username.toLowerCase(),
      nom,
      prenom,
      email.toLowerCase(),
      telephone,
      passwordHash,
      institution_id,
      role.id,
    );

    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO email_verification_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, verificationToken, expiresAt);

    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    console.log("📧 Verification URL:", verificationUrl);

    return res.status(201).json({
      message: "Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.",
      verification_url: verificationUrl, // Remove in production
      user_id: userId,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

/* ==========================================================
   VERIFY EMAIL
========================================================== */
router.get("/verify-email", (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Token manquant." });
    }

    const db = getDb();

    const record = db.prepare(`
      SELECT evt.user_id, evt.expires_at, u.email_verified
      FROM email_verification_tokens evt
      JOIN users u ON u.id = evt.user_id
      WHERE evt.token = ?
    `).get(token);

    if (!record) {
      return res.status(400).json({ error: "Token invalide." });
    }

    if (record.email_verified) {
      return res.json({ message: "Email déjà vérifié." });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "Le token a expiré." });
    }

    db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(record.user_id);
    db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(record.user_id);

    return res.json({
      message: "Email vérifié avec succès ! Votre compte est en attente d'approbation.",
    });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

/* ==========================================================
   LOGIN — STEP 1: CREDENTIALS
========================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const db = getDb();

    const user = db.prepare(`
      SELECT
        u.id, u.username, u.nom, u.prenom, u.email,
        u.telephone, u.password_hash,
        u.institution_id, u.email_verified,
        u.approval_status,
        r.role_name,
        i.institution_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN institutions i ON i.id = u.institution_id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Veuillez vérifier votre email.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (user.approval_status === "pending") {
      return res.status(403).json({
        error: "Compte en attente d'approbation.",
        code: "PENDING_APPROVAL",
      });
    }

    if (user.approval_status === "rejected") {
      return res.status(403).json({
        error: "Compte refusé.",
        code: "REJECTED",
      });
    }

    if (!user.telephone) {
      return res.status(400).json({
        error: "Numéro de téléphone manquant. Contactez l'administration.",
        code: "NO_PHONE",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate previous OTPs
    db.prepare("UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0").run(user.id);

    // Store new OTP
    db.prepare(`
      INSERT INTO otp_codes (id, user_id, code, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(uuidv4(), user.id, otpCode, expiresAt);

    // Send Email — graceful failure
    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (emailError) {
      console.error("Email send failed:", emailError.message);
      return res.status(500).json({
        error: "Impossible d'envoyer l'email. Veuillez réessayer plus tard.",
      });
    }

    const sessionToken = jwt.sign(
      { userId: user.id, step: "otp_pending" },
      JWT_SECRET,
      { expiresIn: "10m" },
    );

    // FIX: mask email for preview
    const [localPart, domain] = user.email.split('@');
    const maskedEmail = localPart[0] + '*'.repeat(Math.max(1, localPart.length - 1)) + '@' + domain;

    return res.json({
      requires_otp: true,
      session_token: sessionToken,
      user_preview: {
        name: `${user.prenom} ${user.nom}`,
        email: user.email,
        phone: user.telephone, // still send telephone for completeness if needed, or remove
        masked_contact: maskedEmail, // changed preview field
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

/* ==========================================================
   LOGIN — STEP 2: VERIFY OTP
========================================================== */
router.post("/verify-otp", (req, res) => {
  try {
    const { session_token, otp_code } = req.body;

    if (!session_token || !otp_code) {
      return res.status(400).json({ error: "Session et OTP requis." });
    }

    let decoded;
    try {
      decoded = jwt.verify(session_token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Session expirée. Veuillez vous reconnecter." });
    }

    if (decoded.step !== "otp_pending") {
      return res.status(400).json({ error: "Session invalide." });
    }

    const db = getDb();

    const otp = db.prepare(`
      SELECT id FROM otp_codes
      WHERE user_id = ?
        AND code = ?
        AND used = 0
        AND expires_at > datetime('now')
      ORDER BY expires_at DESC
      LIMIT 1
    `).get(decoded.userId, otp_code.trim());

    if (!otp) {
      return res.status(401).json({ error: "OTP invalide ou expiré." });
    }

    db.prepare("UPDATE otp_codes SET used = 1 WHERE id = ?").run(otp.id);

    const user = db.prepare(`
      SELECT
        u.id, u.email, u.nom, u.prenom,
        u.institution_id,
        r.role_name,
        i.institution_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN institutions i ON i.id = u.institution_id
      WHERE u.id = ?
    `).get(decoded.userId);

    // Guard: user deleted between steps
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role_name,
        institutionId: user.institution_id,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const avatarInitials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

    return res.json({
      message: "Connexion réussie.",
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: `${user.prenom} ${user.nom}`,
        email: user.email,
        role: user.role_name,
        institutionId: user.institution_id,
        institutionName: user.institution_name,
        avatarInitials,
      },
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;