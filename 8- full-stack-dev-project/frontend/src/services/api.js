/**
 * Livello API centralizzato. Tutte le chiamate di recupero passano da qui, quindi il resto del
 * codice può rimanere semplice.
 */

const BASE = '/api';

// ── Helper generico ────────────────────────────────────────────────────────────
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // Analizza il body indipendentemente dallo status così possiamo mostrare messaggi backend
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

// ── Articoli ────────────────────────────────────────────────────────────────────

/**
 * Fetches the list of papers.
 * @param {{ search?: string, author?: string, year?: string }} filters
 */
export function getPapers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.author) params.set('author', filters.author);
  if (filters.year)   params.set('year',   filters.year);
  const qs = params.toString();
  return request(`${BASE}/papers${qs ? `?${qs}` : ''}`);
}

/** Fetches a single paper together with its citations array. */
export function getPaper(id) {
  return request(`${BASE}/papers/${id}`);
}

/** Creates a new paper and returns the created record. */
export function createPaper(data) {
  return request(`${BASE}/papers`, { method: 'POST', body: JSON.stringify(data) });
}

/** Updates an existing paper and returns the updated record. */
export function updatePaper(id, data) {
  return request(`${BASE}/papers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Elimina un articolo (e le sue citazioni via cascade). */
export function deletePaper(id) {
  return request(`${BASE}/papers/${id}`, { method: 'DELETE' });
}

// ── Citazioni ─────────────────────────────────────────────────────────────────

/** Recupera citazioni per un dato articolo. */
export function getCitations(paperId) {
  return request(`${BASE}/papers/${paperId}/citations`);
}

/** Aggiunge una citazione a un articolo. */
export function createCitation(paperId, data) {
  return request(`${BASE}/papers/${paperId}/citations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Aggiorna una citazione. */
export function updateCitation(id, data) {
  return request(`${BASE}/citations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Elimina una citazione. */
export function deleteCitation(id) {
  return request(`${BASE}/citations/${id}`, { method: 'DELETE' });
}
