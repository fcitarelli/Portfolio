/**
 * Test funzionali per l'API REST degli Articoli.
 * Utilizza supertest per inviare richieste HTTP all'app Express
 * e un database SQLite in memoria (NODE_ENV=test, impostato in setup.js).
 */

const request = require('supertest');
const app = require('../server');
const db = require('../db');

// ── Helper ───────────────────────────────────────────────────────────────────
const SAMPLE_PAPER = {
  title: 'Deep Learning for NLP',
  authors: 'Rossi, M.; Bianchi, L.',
  abstract: 'A survey of deep learning techniques applied to natural language processing.',
  publication_date: '2023-06-15',
  doi: '10.1000/nlp.2023.001',
};

// Pulisci tabelle prima di ogni test per garantire isolamento
beforeEach(() => {
  db.exec('DELETE FROM citations; DELETE FROM papers;');
});

// ── Test ─────────────────────────────────────────────────────────────────────

describe('Papers API – GET /api/papers', () => {
  test('1. returns an empty array when no papers exist', async () => {
    const res = await request(app).get('/api/papers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test('2. returns all papers after insertion', async () => {
    db.prepare(
      'INSERT INTO papers (title, authors) VALUES (?, ?)'
    ).run('Paper A', 'Author A');
    db.prepare(
      'INSERT INTO papers (title, authors) VALUES (?, ?)'
    ).run('Paper B', 'Author B');

    const res = await request(app).get('/api/papers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('3. filters papers by search term (title)', async () => {
    db.prepare('INSERT INTO papers (title, authors) VALUES (?, ?)').run(
      'Machine Learning Basics', 'Author A'
    );
    db.prepare('INSERT INTO papers (title, authors) VALUES (?, ?)').run(
      'Web Development Guide', 'Author B'
    );

    const res = await request(app).get('/api/papers?search=Machine');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Machine Learning Basics');
  });

  test('4. filters papers by author name', async () => {
    db.prepare('INSERT INTO papers (title, authors) VALUES (?, ?)').run(
      'Paper X', 'Verdi, G.'
    );
    db.prepare('INSERT INTO papers (title, authors) VALUES (?, ?)').run(
      'Paper Y', 'Rossi, M.'
    );

    const res = await request(app).get('/api/papers?author=Rossi');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].authors).toContain('Rossi');
  });

  test('5. filters papers by publication year', async () => {
    db.prepare(
      'INSERT INTO papers (title, authors, publication_date) VALUES (?, ?, ?)'
    ).run('Old Paper', 'Author A', '2018-01-01');
    db.prepare(
      'INSERT INTO papers (title, authors, publication_date) VALUES (?, ?, ?)'
    ).run('New Paper', 'Author B', '2023-03-10');

    const res = await request(app).get('/api/papers?year=2023');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('New Paper');
  });
});

describe('Papers API – POST /api/papers', () => {
  test('6. creates a paper with all fields', async () => {
    const res = await request(app).post('/api/papers').send(SAMPLE_PAPER);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe(SAMPLE_PAPER.title);
    expect(res.body.doi).toBe(SAMPLE_PAPER.doi);
  });

  test('7. returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/papers')
      .send({ authors: 'Author A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('8. returns 400 when authors are missing', async () => {
    const res = await request(app)
      .post('/api/papers')
      .send({ title: 'A paper without authors' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('Papers API – GET /api/papers/:id', () => {
  test('9. returns paper with its citations', async () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO papers (title, authors) VALUES (?, ?)')
      .run('Paper with Citations', 'Author A');

    db.prepare('INSERT INTO citations (paper_id, text, authors, year) VALUES (?, ?, ?, ?)').run(
      lastInsertRowid, 'Referenced work', 'Cite Author', 2020
    );

    const res = await request(app).get(`/api/papers/${lastInsertRowid}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Paper with Citations');
    expect(Array.isArray(res.body.citations)).toBe(true);
    expect(res.body.citations).toHaveLength(1);
  });

  test('10. returns 404 for a non-existent paper', async () => {
    const res = await request(app).get('/api/papers/99999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('Papers API – PUT /api/papers/:id', () => {
  test('11. updates an existing paper', async () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO papers (title, authors) VALUES (?, ?)')
      .run('Original Title', 'Original Author');

    const res = await request(app)
      .put(`/api/papers/${lastInsertRowid}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    // Unchanged field should be preserved
    expect(res.body.authors).toBe('Original Author');
  });

  test('12. returns 404 when updating a non-existent paper', async () => {
    const res = await request(app)
      .put('/api/papers/99999')
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('Papers API – DELETE /api/papers/:id', () => {
  test('13. deletes a paper and cascades to citations', async () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO papers (title, authors) VALUES (?, ?)')
      .run('To Delete', 'Author');
    db.prepare('INSERT INTO citations (paper_id, text) VALUES (?, ?)').run(
      lastInsertRowid, 'Some citation'
    );

    const res = await request(app).delete(`/api/papers/${lastInsertRowid}`);
    expect(res.status).toBe(200);

    // Paper should be gone
    const paper = db.prepare('SELECT * FROM papers WHERE id = ?').get(lastInsertRowid);
    expect(paper).toBeUndefined();

    // Citations should be gone (cascade)
    const citations = db
      .prepare('SELECT * FROM citations WHERE paper_id = ?')
      .all(lastInsertRowid);
    expect(citations).toHaveLength(0);
  });

  test('14. returns 404 when deleting a non-existent paper', async () => {
    const res = await request(app).delete('/api/papers/99999');
    expect(res.status).toBe(404);
  });
});

describe('Health check', () => {
  test('15. GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
