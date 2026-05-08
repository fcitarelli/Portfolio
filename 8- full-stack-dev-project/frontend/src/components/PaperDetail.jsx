/**
 * Recupera e mostra le informazioni complete su un singolo articolo,
 * incluse le citazioni associate gestite da CitationPanel.
 */

import { useState, useEffect } from 'react';
import { getPaper } from '../services/api';
import CitationPanel from './CitationPanel';
import './PaperDetail.css';

export default function PaperDetail({ paperId, onEdit, onBack }) {
  const [paper, setPaper]   = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoad(true);
      setError('');
      try {
        const data = await getPaper(paperId);
        if (!cancelled) setPaper(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoad(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paperId]);

  if (loading) return <div className="spinner" role="status" aria-label="Caricamento…" />;
  if (error)   return <p className="error-msg" role="alert">{error}</p>;
  if (!paper)  return null;

  return (
    <article className="paper-detail card" aria-label="Dettaglio articolo">
      {/* ── Riga intestazione ────────────────────────────────────────────────── */}
      <div className="paper-detail__header">
        <div>
          <h2 className="paper-detail__title">{paper.title}</h2>
          <p className="paper-detail__authors">{paper.authors}</p>
        </div>
        <div className="paper-detail__header-actions">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Indietro
          </button>
          <button className="btn btn-blue btn-sm" onClick={onEdit}>
            ✏️ Modifica
          </button>
        </div>
      </div>

      {/* ── Meta ──────────────────────────────────────────────────────── */}
      <div className="paper-detail__meta">
        {paper.publication_date && (
          <div className="meta-item">
            <span className="meta-label">Data di pubblicazione</span>
            <span>{paper.publication_date}</span>
          </div>
        )}
        {paper.doi && (
          <div className="meta-item">
            <span className="meta-label">DOI</span>
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="doi-link"
            >
              {paper.doi}
            </a>
          </div>
        )}
      </div>

      {/* ── Abstract ──────────────────────────────────────────────────── */}
      {paper.abstract && (
        <section className="paper-detail__abstract">
          <h3>Abstract</h3>
          <p>{paper.abstract}</p>
        </section>
      )}

      {/* ── Citazioni ─────────────────────────────────────────────────── */}
      <CitationPanel
        paperId={paper.id}
        citations={paper.citations || []}
        onCitationsChange={(updated) => setPaper({ ...paper, citations: updated })}
      />
    </article>
  );
}
