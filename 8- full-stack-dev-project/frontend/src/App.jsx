/**
 * Componente radice / controller di navigazione
 *
 * Gestisce quale "vista" è attualmente mostrata (list | add | edit | detail)
 * e passa i callback appropriati ai componenti figlio.
 * La navigazione viene gestita tramite lo stato locale anziché tramite un router, per ridurre al minimo l'ingombro delle dipendenze.
 */

import { useState, useEffect, useCallback } from 'react';
import PaperList from './components/PaperList';
import PaperForm from './components/PaperForm';
import PaperDetail from './components/PaperDetail';
import SearchFilter from './components/SearchFilter';
import { getPapers } from './services/api';
import './App.css';

// Possible views
const VIEW = { LIST: 'list', ADD: 'add', EDIT: 'edit', DETAIL: 'detail' };

export default function App() {
  const [view, setView]               = useState(VIEW.LIST);
  const [papers, setPapers]           = useState([]);
  const [selectedPaper, setSelected]  = useState(null);
  const [filters, setFilters]         = useState({ search: '', author: '', year: '' });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Fetch papers whenever filters change
  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPapers(filters);
      setPapers(data);
    } catch {
      setError('Impossibile caricare gli articoli. Assicurati che il backend sia in esecuzione.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (view === VIEW.LIST) fetchPapers();
  }, [filters, view, fetchPapers]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goList   = () => { setSelected(null); setView(VIEW.LIST); };
  const goAdd    = () => { setSelected(null); setView(VIEW.ADD); };
  const goEdit   = (paper) => { setSelected(paper); setView(VIEW.EDIT); };
  const goDetail = (paper) => { setSelected(paper); setView(VIEW.DETAIL); };

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <h1 onClick={goList} role="link" tabIndex={0} onKeyDown={e => e.key === 'Enter' && goList()}>
            📚 ScholarPort
          </h1>
          <span className="tagline">Il tuo portfolio accademico professionale</span>
        </div>

        {view === VIEW.LIST ? (
          <button className="btn btn-primary" onClick={goAdd}>
            + Nuovo Articolo
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={goList}>
            ← Torna alla lista
          </button>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="app-main">
        {view === VIEW.LIST && (
          <>
            <SearchFilter filters={filters} onFilterChange={setFilters} />
            {error && <p className="error-msg" role="alert">{error}</p>}
            <PaperList
              papers={papers}
              loading={loading}
              onView={goDetail}
              onEdit={goEdit}
              onRefresh={fetchPapers}
            />
          </>
        )}

        {(view === VIEW.ADD || view === VIEW.EDIT) && (
          <PaperForm
            paper={view === VIEW.EDIT ? selectedPaper : null}
            onSuccess={goList}
            onCancel={goList}
          />
        )}

        {view === VIEW.DETAIL && selectedPaper && (
          <PaperDetail
            paperId={selectedPaper.id}
            onEdit={() => goEdit(selectedPaper)}
            onBack={goList}
          />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>ScholarPort &copy; {new Date().getFullYear()} — Gestione Portfolio Accademico</p>
      </footer>
    </div>
  );
}
