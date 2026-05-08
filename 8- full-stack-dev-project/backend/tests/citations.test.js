/**
 * Test funzionali per l'API REST delle Citazioni.
 */

const request = require('supertest');
const app = require('../server');
const db = require('../db');

// ── Helper ───────────────────────────────────────────────────────────────────
let paperId; // shared paper used across citation tests

beforeEach(() => {
  db.exec('DELETE FROM citations; DELETE FROM papers;');
  // Crea un articolo a cui allegare le citazioni
  const result = db
    .prepare('INSERT INTO papers (title, authors) VALUES (?, ?)')
    .run('Host Paper', 'Host Author');
  paperId = result.lastInsertRowid;
});

// ── Test ─────────────────────────────────────────────────────────────────────

describe('Citations API – GET /api/papers/:paperId/citations', () => {
  test('1. returns empty array when paper has no citations', async () => {
    const res = await request(app).get(`/api/papers/${paperId}/citations`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test('2. returns citations belonging to the paper', async () => {
    db.prepare(
      'INSERT INTO citations (paper_id, text, authors, year) VALUES (?, ?, ?, ?)'
    ).run(paperId, 'LeCun et al., 1989', 'LeCun, Y.', 1989);

    const res = await request(app).get(`/api/papers/${paperId}/citations`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe('LeCun et al., 1989');
  });

  test('3. returns 404 when paper does not exist', async () => {
    const res = await request(app).get('/api/papers/99999/citations');
    expect(res.status).toBe(404);
  });
});

describe('Citations API – POST /api/papers/:paperId/citations', () => {
  test('4. creates a citation with full data', async () => {
    const payload = {
      text: 'Vaswani et al. – Attention is All You Need',
      authors: 'Vaswani, A.; Shazeer, N.',
      year: 2017,
    };
    const res = await request(app)
      .post(`/api/papers/${paperId}/citations`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.text).toBe(payload.text);
    expect(res.body.year).toBe(2017);
    expect(res.body.paper_id).toBe(paperId);
  });

  test('5. returns 400 when citation text is missing', async () => {
    const res = await request(app)
      .post(`/api/papers/${paperId}/citations`)
      .send({ authors: 'Author', year: 2020 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('6. returns 400 when year is invalid', async () => {
    const res = await request(app)
      .post(`/api/papers/${paperId}/citations`)
      .send({ text: 'Some reference', year: 'not-a-year' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('7. returns 404 when target paper does not exist', async () => {
    const res = await request(app)
      .post('/api/papers/99999/citations')
      .send({ text: 'Orphan citation' });
    expect(res.status).toBe(404);
  });
});

describe('Citations API – PUT /api/citations/:id', () => {
  test('8. updates an existing citation', async () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO citations (paper_id, text, year) VALUES (?, ?, ?)')
      .run(paperId, 'Old text', 2010);

    const res = await request(app)
      .put(`/api/citations/${lastInsertRowid}`)
      .send({ text: 'Updated text', year: 2011 });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Updated text');
    expect(res.body.year).toBe(2011);
  });

  test('9. returns 404 when citation does not exist', async () => {
    const res = await request(app)
      .put('/api/citations/99999')
      .send({ text: 'Ghost citation' });
    expect(res.status).toBe(404);
  });
});

describe('Citations API – DELETE /api/citations/:id', () => {
  test('10. deletes an existing citation', async () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO citations (paper_id, text) VALUES (?, ?)')
      .run(paperId, 'To be deleted');

    const res = await request(app).delete(`/api/citations/${lastInsertRowid}`);
    expect(res.status).toBe(200);

    const citation = db
      .prepare('SELECT * FROM citations WHERE id = ?')
      .get(lastInsertRowid);
    expect(citation).toBeUndefined();
  });

  test('11. returns 404 when deleting a non-existent citation', async () => {
    const res = await request(app).delete('/api/citations/99999');
    expect(res.status).toBe(404);
  });

  test('12. deleting a paper cascades to its citations', async () => {
    db.prepare('INSERT INTO citations (paper_id, text) VALUES (?, ?)').run(
      paperId, 'Cascade test'
    );

    await request(app).delete(`/api/papers/${paperId}`);

    const citations = db
      .prepare('SELECT * FROM citations WHERE paper_id = ?')
      .all(paperId);
    expect(citations).toHaveLength(0);
  });
});
