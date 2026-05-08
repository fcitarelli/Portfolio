/**
 * GET    /api/papers          – lista articoli (supporta ?search, ?author, ?year)
 * GET    /api/papers/:id      – ottieni articolo + le sue citazioni
 * POST   /api/papers          – crea articolo
 * PUT    /api/papers/:id      – aggiorna articolo
 * DELETE /api/papers/:id      – elimina articolo (cascata alle citazioni)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── Lista / ricerca ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { search, author, year } = req.query;

    // Costruisci una clausola WHERE dinamica per supportare qualsiasi combinazione di filtri
    let sql = 'SELECT * FROM papers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR abstract LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (author) {
      sql += ' AND authors LIKE ?';
      params.push(`%${author}%`);
    }
    if (year) {
      
      sql += ' AND publication_date LIKE ?';
      params.push(`${year}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const papers = db.prepare(sql).all(...params);
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Ottieni singolo articolo con le sue citazioni ───────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    const citations = db
      .prepare('SELECT * FROM citations WHERE paper_id = ? ORDER BY year DESC, created_at DESC')
      .all(req.params.id);

    res.json({ ...paper, citations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Crea articolo ──────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { title, authors, abstract, publication_date, doi } = req.body;

    // Valida campi obbligatori
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Il titolo è obbligatorio' });
    }
    if (!authors || !authors.trim()) {
      return res.status(400).json({ error: 'Gli autori sono obbligatori' });
    }

    const result = db
      .prepare(
        'INSERT INTO papers (title, authors, abstract, publication_date, doi) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        title.trim(),
        authors.trim(),
        abstract ? abstract.trim() : '',
        publication_date ? publication_date.trim() : '',
        doi ? doi.trim() : ''
      );

    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Aggiorna articolo ──────────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Paper not found' });

    const { title, authors, abstract, publication_date, doi } = req.body;

    // Unisci campi in entrata con valori esistenti (comportamento PATCH-style via PUT)
    db.prepare(
      'UPDATE papers SET title = ?, authors = ?, abstract = ?, publication_date = ?, doi = ? WHERE id = ?'
    ).run(
      title !== undefined ? title.trim() : existing.title,
      authors !== undefined ? authors.trim() : existing.authors,
      abstract !== undefined ? abstract.trim() : existing.abstract,
      publication_date !== undefined ? publication_date.trim() : existing.publication_date,
      doi !== undefined ? doi.trim() : existing.doi,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Elimina articolo ──────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    // ON DELETE CASCADE gestisce le citazioni automaticamente
    db.prepare('DELETE FROM papers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Articolo eliminato con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
