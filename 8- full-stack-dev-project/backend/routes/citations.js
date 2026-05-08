/**
 * GET    /api/papers/:paperId/citations  – lista citazioni per un articolo
 * POST   /api/papers/:paperId/citations  – aggiungi citazione a un articolo
 * PUT    /api/citations/:id              – aggiorna una citazione
 * DELETE /api/citations/:id              – elimina una citazione
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── Lista citazioni per un articolo ────────────────────────────────────────────────
router.get('/papers/:paperId/citations', (req, res) => {
  try {
    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    const citations = db
      .prepare(
        'SELECT * FROM citations WHERE paper_id = ? ORDER BY year DESC, created_at DESC'
      )
      .all(req.params.paperId);

    res.json(citations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Aggiungi citazione a un articolo ───────────────────────────────────────────────────
router.post('/papers/:paperId/citations', (req, res) => {
  try {
    const paper = db.prepare('SELECT id FROM papers WHERE id = ?').get(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    const { text, authors, year } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Il testo della citazione è obbligatorio' });
    }

    const parsedYear = year ? parseInt(year, 10) : null;
    if (year && (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > 9999)) {
      return res.status(400).json({ error: "L'anno deve essere un numero a 4 cifre" });
    }

    const result = db
      .prepare(
        'INSERT INTO citations (paper_id, text, authors, year) VALUES (?, ?, ?, ?)'
      )
      .run(req.params.paperId, text.trim(), authors ? authors.trim() : '', parsedYear);

    const citation = db.prepare('SELECT * FROM citations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(citation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Aggiorna una citazione ─────────────────────────────────────────────────────────
router.put('/citations/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM citations WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Citation not found' });

    const { text, authors, year } = req.body;
    const parsedYear = year ? parseInt(year, 10) : existing.year;

    db.prepare('UPDATE citations SET text = ?, authors = ?, year = ? WHERE id = ?').run(
      text !== undefined ? text.trim() : existing.text,
      authors !== undefined ? authors.trim() : existing.authors,
      parsedYear,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM citations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Elimina una citazione ─────────────────────────────────────────────────────────
router.delete('/citations/:id', (req, res) => {
  try {
    const citation = db.prepare('SELECT * FROM citations WHERE id = ?').get(req.params.id);
    if (!citation) return res.status(404).json({ error: 'Citation not found' });

    db.prepare('DELETE FROM citations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Citazione eliminata con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
