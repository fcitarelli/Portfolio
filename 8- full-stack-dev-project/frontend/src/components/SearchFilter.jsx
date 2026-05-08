/**
 * Fornisce tre input di filtro (testo ricerca, autore, anno) che il genitore
 * usa per interrogare l'API. Ogni input è debounced tramite un timer locale così che
 * il genitore veda un nuovo oggetto filtri solo dopo che l'utente smette di digitare.
 */

import { useState, useEffect } from 'react';
import './SearchFilter.css';

export default function SearchFilter({ filters, onFilterChange }) {
  // Local state mirrors the prop so inputs are controlled but not re-rendering
  // the parent on every keystroke
  const [local, setLocal] = useState(filters);

  // Sync local state when parent resets filters
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  // Debounce: propagate change to parent 400ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(local);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const handleChange = (field) => (e) =>
    setLocal((prev) => ({ ...prev, [field]: e.target.value }));

  const handleReset = () => {
    const empty = { search: '', author: '', year: '' };
    setLocal(empty);
    onFilterChange(empty);
  };

  const hasFilters = local.search || local.author || local.year;

  return (
    <section className="search-filter" aria-label="Filtri di ricerca">
      <div className="filter-row">
        <div className="filter-item filter-item--wide">
          <label htmlFor="sf-search">Cerca</label>
          <input
            id="sf-search"
            type="search"
            placeholder="Titolo o abstract…"
            value={local.search}
            onChange={handleChange('search')}
            aria-label="Cerca per titolo o abstract"
          />
        </div>

        <div className="filter-item">
          <label htmlFor="sf-author">Autore</label>
          <input
            id="sf-author"
            type="text"
            placeholder="Es. Rossi"
            value={local.author}
            onChange={handleChange('author')}
            aria-label="Filtra per autore"
          />
        </div>

        <div className="filter-item filter-item--narrow">
          <label htmlFor="sf-year">Anno</label>
          <input
            id="sf-year"
            type="number"
            placeholder="Es. 2023"
            min="1900"
            max="2099"
            value={local.year}
            onChange={handleChange('year')}
            aria-label="Filtra per anno di pubblicazione"
          />
        </div>

        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm filter-reset"
            onClick={handleReset}
            aria-label="Azzera filtri"
          >
            ✕ Azzera
          </button>
        )}
      </div>
    </section>
  );
}
