/**
 * Gestisce sia la creazione (paper === null) che la modifica (paper !== null).
 * Valida i campi obbligatori lato client prima dell'invio, e mostra errori lato server quando si verificano.
 */

import { useState } from 'react';
import { createPaper, updatePaper } from '../services/api';
import './PaperForm.css';

const EMPTY = {
  title: '',
  authors: '',
  abstract: '',
  publication_date: '',
  doi: '',
};

export default function PaperForm({ paper, onSuccess, onCancel }) {
  const isEdit = !!paper;

  // Pre-populate fields when editing
  const [form, setForm] = useState(
    isEdit
      ? {
          title:            paper.title,
          authors:          paper.authors,
          abstract:         paper.abstract,
          publication_date: paper.publication_date,
          doi:              paper.doi,
        }
      : EMPTY
  );

  const [errors, setErrors]   = useState({});
  const [apiError, setApiErr] = useState('');
  const [submitting, setSub]  = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Client-side validation
  const validate = () => {
    const errs = {};
    if (!form.title.trim())   errs.title   = 'Il titolo è obbligatorio';
    if (!form.authors.trim()) errs.authors = 'Gli autori sono obbligatori';
    if (form.doi && !/^10\.\d{4,9}\/\S+$/.test(form.doi.trim())) {
      errs.doi = 'Formato DOI non valido (es. 10.1000/xyz123)';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErr('');

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSub(true);
    try {
      if (isEdit) {
        await updatePaper(paper.id, form);
      } else {
        await createPaper(form);
      }
      onSuccess();
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="paper-form-wrapper">
      <div className="card paper-form-card">
        <h2 className="form-title">
          {isEdit ? '✏️  Modifica articolo' : '➕  Nuovo articolo'}
        </h2>

        {apiError && <p className="error-msg" role="alert">{apiError}</p>}

        <form onSubmit={handleSubmit} noValidate aria-label="form-articolo">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="pf-title">
              Titolo <span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="pf-title"
              type="text"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="Es. Deep Learning for NLP"
              aria-required="true"
              aria-describedby={errors.title ? 'pf-title-err' : undefined}
            />
            {errors.title && (
              <span id="pf-title-err" className="field-error" role="alert">
                {errors.title}
              </span>
            )}
          </div>

          {/* Authors */}
          <div className="form-group">
            <label htmlFor="pf-authors">
              Autori <span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="pf-authors"
              type="text"
              value={form.authors}
              onChange={handleChange('authors')}
              placeholder="Es. Rossi, M.; Bianchi, L."
              aria-required="true"
              aria-describedby={errors.authors ? 'pf-authors-err' : undefined}
            />
            {errors.authors && (
              <span id="pf-authors-err" className="field-error" role="alert">
                {errors.authors}
              </span>
            )}
          </div>

          {/* Abstract */}
          <div className="form-group">
            <label htmlFor="pf-abstract">Abstract</label>
            <textarea
              id="pf-abstract"
              value={form.abstract}
              onChange={handleChange('abstract')}
              placeholder="Breve descrizione dell'articolo…"
              rows={4}
            />
          </div>

          {/* Publication date */}
          <div className="form-group">
            <label htmlFor="pf-date">Data di pubblicazione</label>
            <input
              id="pf-date"
              type="date"
              value={form.publication_date}
              onChange={handleChange('publication_date')}
            />
          </div>

          {/* DOI */}
          <div className="form-group">
            <label htmlFor="pf-doi">DOI</label>
            <input
              id="pf-doi"
              type="text"
              value={form.doi}
              onChange={handleChange('doi')}
              placeholder="Es. 10.1000/xyz123"
              aria-describedby={errors.doi ? 'pf-doi-err' : undefined}
            />
            {errors.doi && (
              <span id="pf-doi-err" className="field-error" role="alert">
                {errors.doi}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-blue"
              disabled={submitting}
            >
              {submitting ? 'Salvataggio…' : isEdit ? 'Aggiorna' : 'Crea articolo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
