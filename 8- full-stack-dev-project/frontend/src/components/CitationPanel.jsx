/**
 * Mostra la lista delle citazioni per un articolo e fornisce un form
 * per aggiungerne di nuove. Ogni citazione può anche essere eliminata.
 */

import { useState } from 'react';
import { createCitation, deleteCitation } from '../services/api';
import './CitationPanel.css';

export default function CitationPanel({ paperId, citations, onCitationsChange }) {
  const [form, setForm]     = useState({ text: '', authors: '', year: '' });
  const [error, setError]   = useState('');
  const [adding, setAdding] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.text.trim()) {
      setError('Il testo della citazione è obbligatorio');
      return;
    }

    setAdding(true);
    try {
      const created = await createCitation(paperId, {
        text:    form.text.trim(),
        authors: form.authors.trim(),
        year:    form.year ? parseInt(form.year, 10) : undefined,
      });
      onCitationsChange([created, ...citations]);
      setForm({ text: '', authors: '', year: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (citation) => {
    if (!window.confirm('Eliminare questa citazione?')) return;
    try {
      await deleteCitation(citation.id);
      onCitationsChange(citations.filter((c) => c.id !== citation.id));
    } catch (err) {
      alert(`Errore: ${err.message}`);
    }
  };

  return (
    <section className="citation-panel" aria-label="Citazioni">
      <h3 className="citation-panel__title">
        Citazioni ({citations.length})
      </h3>

      {/* ── Form aggiunta ──────────────────────────────────────────────────── */}
      <form
        className="citation-form"
        onSubmit={handleAdd}
        noValidate
        aria-label="form-citazione"
      >
        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="citation-form__row">
          <div className="form-group" style={{ flex: 3 }}>
            <label htmlFor="cf-text">
              Testo <span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="cf-text"
              type="text"
              value={form.text}
              onChange={handleChange('text')}
              placeholder="Es. LeCun et al. (1989) – Backpropagation…"
              aria-required="true"
            />
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="cf-authors">Autori</label>
            <input
              id="cf-authors"
              type="text"
              value={form.authors}
              onChange={handleChange('authors')}
              placeholder="Es. LeCun, Y."
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="cf-year">Anno</label>
            <input
              id="cf-year"
              type="number"
              value={form.year}
              onChange={handleChange('year')}
              placeholder="2023"
              min="1000"
              max="2099"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-blue btn-sm" disabled={adding}>
            {adding ? 'Aggiunta…' : '+ Aggiungi citazione'}
          </button>
        </div>
      </form>

      {/* ── Lista citazioni ─────────────────────────────────────────────── */}
      {citations.length === 0 ? (
        <p className="info-msg" style={{ padding: '1rem 0' }}>
          Nessuna citazione aggiunta.
        </p>
      ) : (
        <ul className="citation-list" aria-label="Lista citazioni">
          {citations.map((c) => (
            <li key={c.id} className="citation-item" data-testid="citation-item">
              <div className="citation-item__body">
                <p className="citation-item__text">{c.text}</p>
                <div className="citation-item__meta">
                  {c.authors && <span>{c.authors}</span>}
                  {c.year && <span className="badge">{c.year}</span>}
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(c)}
                aria-label={`Elimina citazione: ${c.text}`}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
