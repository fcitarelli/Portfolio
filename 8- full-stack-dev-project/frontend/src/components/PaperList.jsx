/**
 * Renderizza la lista degli articoli restituiti dall'API.
 * Ogni scheda mostra: titolo, autori, anno di pubblicazione, badge DOI e pulsanti di azione (Visualizza, Modifica, Elimina).
 */

import { deletePaper } from '../services/api';
import './PaperList.css';

export default function PaperList({ papers, loading, onView, onEdit, onRefresh }) {
  const handleDelete = async (paper) => {
    if (!window.confirm(`Eliminare "${paper.title}"? Le citazioni associate saranno rimosse.`))
      return;
    try {
      await deletePaper(paper.id);
      onRefresh();
    } catch (err) {
      alert(`Errore durante l'eliminazione: ${err.message}`);
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Caricamento…" />;

  if (!papers.length) {
    return (
      <p className="info-msg" data-testid="empty-list">
        Nessun articolo trovato.{' '}
        <span role="img" aria-label="libro">📖</span>
        {' '}Aggiungi il tuo primo articolo accademico!
      </p>
    );
  }

  return (
    <ul className="paper-list" aria-label="Lista articoli">
      {papers.map((paper) => (
        <li key={paper.id} className="paper-card" data-testid="paper-card">
          <div className="paper-card__body">
            <h2 className="paper-card__title">{paper.title}</h2>
            <p className="paper-card__authors">{paper.authors}</p>

            <div className="paper-card__meta">
              {paper.publication_date && (
                <span className="badge">{paper.publication_date.slice(0, 4)}</span>
              )}
              {paper.doi && (
                <span className="paper-card__doi" title={paper.doi}>
                  DOI: {paper.doi}
                </span>
              )}
            </div>

            {paper.abstract && (
              <p className="paper-card__abstract">{paper.abstract}</p>
            )}
          </div>

          <div className="paper-card__actions">
            <button
              className="btn btn-blue btn-sm"
              onClick={() => onView(paper)}
              aria-label={`Visualizza ${paper.title}`}
            >
              Dettagli
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(paper)}
              aria-label={`Modifica ${paper.title}`}
            >
              Modifica
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(paper)}
              aria-label={`Elimina ${paper.title}`}
            >
              Elimina
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
