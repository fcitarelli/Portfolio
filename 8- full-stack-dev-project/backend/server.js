/**
 * Monta i router per papers e citations sotto /api,
 * aggiunge un endpoint di health-check, e inizia ad ascoltare su PORT (default 5000).
 *
 * Il module.exports permette a supertest di importare l'app nei test
 * senza avviare il server HTTP.
 */

const express = require('express');
const cors = require('cors');

const papersRouter = require('./routes/papers');
const citationsRouter = require('./routes/citations');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/papers', papersRouter);
app.use('/api', citationsRouter);

// Controllo di salute (utile per prove CI / deployment)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ScholarPort API is running' });
});

// ── Error handlers ────────────────────────────────────────────────────────────
// 404 – route not found
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 500 – errori non gestiti
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Avvia server solo quando eseguito direttamente (non quando importato nei test) ─────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ScholarPort backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
