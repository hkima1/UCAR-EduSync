/**
 * Roles API Routes
 */
const express = require('express');
const { getDb } = require('../db.cjs');

const router = express.Router();

// ─── LIST ALL ROLES ──────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const roles = db.prepare('SELECT id, role_name FROM roles ORDER BY role_name').all();
    res.json({ roles });
  } catch (err) {
    console.error('Roles list error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;
