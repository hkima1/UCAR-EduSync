/**
 * Institutions API Routes
 */
const express = require('express');
const { getDb } = require('../db.cjs');

const router = express.Router();

// ─── LIST ALL INSTITUTIONS ───────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const institutions = db.prepare('SELECT id, institution_name, location FROM institutions ORDER BY institution_name').all();
    res.json({ institutions });
  } catch (err) {
    console.error('Institutions list error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ─── GET INSTITUTION BY ID ───────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const institution = db.prepare('SELECT id, institution_name, location FROM institutions WHERE id = ?').get(req.params.id);
    if (!institution) {
      return res.status(404).json({ error: 'Institution non trouvée.' });
    }
    res.json({ institution });
  } catch (err) {
    console.error('Institution get error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;
