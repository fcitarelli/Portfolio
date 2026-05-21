# ScholarPort — Gestore di Portfolio Accademico

> **Progetto full-stack** realizzato per il corso *AI Developer – ProfessionAI*
> Modulo 10: Full-Stack Development

---

## Indice

1. [Descrizione del progetto](#1-descrizione-del-progetto)
2. [Stack tecnologico](#2-stack-tecnologico)
3. [Struttura del progetto](#3-struttura-del-progetto)
4. [Prerequisiti](#4-prerequisiti)
5. [Installazione](#5-installazione)
6. [Avvio in sviluppo](#6-avvio-in-sviluppo)
7. [Esecuzione dei test](#7-esecuzione-dei-test)
8. [API REST – Riferimento](#8-api-rest--riferimento)
9. [Funzionalità implementate](#9-funzionalità-implementate)
10. [Scelte architetturali](#10-scelte-architetturali)
11. [Deploy / produzione](#11-deploy--produzione)

---

## 1. Descrizione del progetto

**ScholarPort** è una *Single Page Application* che consente ai ricercatori accademici di:

- inserire e gestire i propri **articoli accademici** (titolo, autori, abstract, data di pubblicazione, DOI);
- aggiungere e visualizzare **citazioni** associate a ciascun articolo;
- **cercare e filtrare** gli articoli per titolo/abstract, autore o anno di pubblicazione;
- presentare il proprio portfolio in un layout **responsive**, ottimizzato sia per desktop sia per mobile.

---

## 2. Stack tecnologico

| Livello    | Tecnologie                                                   |
|------------|--------------------------------------------------------------|
| Front-end  | React 18, Vite 5, CSS custom (variabili CSS, Flexbox)        |
| Back-end   | Node.js, Express 4                                           |
| Database   | SQLite (via `better-sqlite3`) — zero-config, file-based      |
| Testing BE | Jest 29, Supertest                                           |
| Testing FE | Vitest 1, React Testing Library, @testing-library/user-event |

> **Nota sul database:** il progetto utilizza SQLite come alternativa SQL a MongoDB (consentita dalle specifiche). SQLite non richiede l'installazione di alcun servizio esterno: il database viene creato automaticamente al primo avvio del backend nel file `backend/scholarport.db`.

---

## 3. Struttura del progetto

```
PROGETTO/
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js          # Entry point Express
│   ├── db.js              # Inizializzazione SQLite + schema
│   ├── routes/
│   │   ├── papers.js      # CRUD articoli + ricerca/filtro
│   │   └── citations.js   # CRUD citazioni
│   └── tests/
│       ├── setup.js       # NODE_ENV=test (in-memory DB)
│       ├── papers.test.js # 15 test funzionali sulle API papers
│       └── citations.test.js # 12 test funzionali sulle API citations
└── frontend/
    ├── package.json
    ├── vite.config.js     # Proxy /api → backend, config Vitest
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx        # Root component / gestione navigazione
        ├── App.css
        ├── index.css
        ├── components/
        │   ├── PaperList.jsx     # Lista articoli con azioni
        │   ├── PaperForm.jsx     # Form creazione / modifica
        │   ├── PaperDetail.jsx   # Dettaglio articolo
        │   ├── CitationPanel.jsx # Gestione citazioni
        │   └── SearchFilter.jsx  # Filtri ricerca con debounce
        ├── services/
        │   └── api.js            # Livello di astrazione HTTP
        └── tests/
            ├── setup.js
            ├── App.test.jsx           # 6 test navigazione
            ├── PaperForm.test.jsx     # 8 test form
            ├── PaperList.test.jsx     # 8 test lista
            ├── SearchFilter.test.jsx  # 7 test filtri
            └── CitationPanel.test.jsx # 7 test citazioni
```

---

## 4. Prerequisiti

- **Node.js** ≥ 18.x ([nodejs.org](https://nodejs.org))
- **npm** ≥ 9.x (incluso con Node.js)

Verifica la versione installata:

```bash
node --version
npm --version
```

> Su Windows, `better-sqlite3` richiede la compilazione nativa. Se si incontrano problemi, installare [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) oppure assicurarsi che Visual Studio Build Tools siano presenti.

---

## 5. Installazione

Dalla directory radice del progetto, installa le dipendenze per **entrambi** i package:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 6. Avvio in sviluppo

Aprire **due terminali** separati:

### Terminale 1 – Backend (porta 5000)

```bash
cd backend
npm run dev
```

Output atteso:

```
ScholarPort backend running on http://localhost:5000
```

### Terminale 2 – Frontend (porta 3000)

```bash
cd frontend
npm run dev
```

Aprire il browser su **http://localhost:3000**

> Il frontend è configurato (in `vite.config.js`) per fare proxy delle chiamate `/api/*` verso `http://localhost:5000`, quindi non è necessaria nessuna configurazione aggiuntiva di CORS in sviluppo.

---

## 7. Esecuzione dei test

### Test Backend

```bash
cd backend
npm test
```

Esegue **27 test** (papers + citations) in un database SQLite in memoria.

### Test Frontend

```bash
cd frontend
npm test
```

Esegue **36 test** (App, PaperForm, PaperList, SearchFilter, CitationPanel) con Vitest + jsdom.

### Report di copertura (opzionale)

```bash
# Frontend
cd frontend
npx vitest run --coverage
```

---

## 8. API REST – Riferimento

Base URL: `http://localhost:5000/api`

### Papers

| Metodo | Endpoint              | Descrizione                                              |
|--------|-----------------------|----------------------------------------------------------|
| GET    | `/papers`             | Lista tutti gli articoli (filtri: `?search=`, `?author=`, `?year=`) |
| GET    | `/papers/:id`         | Dettaglio articolo con array `citations`                 |
| POST   | `/papers`             | Crea un articolo                                         |
| PUT    | `/papers/:id`         | Aggiorna un articolo                                     |
| DELETE | `/papers/:id`         | Elimina un articolo (cascade sulle citazioni)            |

**Body POST/PUT:**

```json
{
  "title": "string (obbligatorio)",
  "authors": "string (obbligatorio)",
  "abstract": "string",
  "publication_date": "YYYY-MM-DD",
  "doi": "string"
}
```

### Citations

| Metodo | Endpoint                          | Descrizione                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/papers/:paperId/citations`      | Lista citazioni di un articolo |
| POST   | `/papers/:paperId/citations`      | Aggiunge una citazione         |
| PUT    | `/citations/:id`                  | Aggiorna una citazione         |
| DELETE | `/citations/:id`                  | Elimina una citazione          |

**Body POST/PUT citations:**

```json
{
  "text": "string (obbligatorio)",
  "authors": "string",
  "year": 2023
}
```

### Esempi cURL

```bash
# Creare un articolo
curl -X POST http://localhost:5000/api/papers \
  -H "Content-Type: application/json" \
  -d '{"title":"Deep Learning","authors":"LeCun, Y.","doi":"10.1000/dl.001"}'

# Cercare per autore
curl "http://localhost:5000/api/papers?author=LeCun"

# Aggiungere una citazione
curl -X POST http://localhost:5000/api/papers/1/citations \
  -H "Content-Type: application/json" \
  -d '{"text":"Backpropagation – LeCun 1986","year":1986}'
```

---

## 9. Funzionalità implementate

### Front-end

- [x] SPA con React 18 (navigazione via stato locale, senza React Router)
- [x] Layout responsive (desktop e mobile) tramite Flexbox e media query
- [x] **Pagina principale** con elenco degli articoli
- [x] **Form inserimento/modifica** con validazione client-side (titolo, autori, formato DOI)
- [x] **Pannello citazioni** per aggiungere, visualizzare ed eliminare citazioni
- [x] **Ricerca e filtro** per titolo/abstract, autore, anno (con debounce 400 ms)
- [x] Gestione stati di caricamento ed errore
- [x] Accessibilità: label, aria-label, role="alert" sui messaggi d'errore

### Back-end

- [x] API REST completa (CRUD articoli e citazioni)
- [x] Filtri combinabili: ricerca full-text su titolo/abstract, filtro autore, filtro anno
- [x] Validazione server-side con messaggi di errore descrittivi
- [x] Relazione articolo ↔ citazioni con `ON DELETE CASCADE`
- [x] Health check (`GET /api/health`)
- [x] Gestione errori centralizzata (middleware Express)

---

## 10. Scelte architetturali

### SQLite invece di MongoDB
SQLite è stato scelto come database perché rientra nella categoria "alternativa SQL" prevista dalle specifiche e azzera la complessità di setup: non richiede un server esterno, funziona su qualsiasi sistema operativo e genera un unico file (`scholarport.db`). In un contesto di produzione con volumi maggiori o accesso concorrente elevato, sarebbe semplice migrare a PostgreSQL modificando solo `db.js` e i file di route (le query SQL rimarrebbero quasi identiche).

### Navigazione via stato (no React Router)
Per mantenere il numero di dipendenze ridotto e la struttura comprensibile, la navigazione tra le viste (lista → dettaglio → form) è gestita tramite una variabile di stato `view` in `App.jsx`. Aggiungere React Router per URL profondi sarebbe un'estensione naturale.

### Vitest per il frontend
Vitest è integrato nativamente con Vite, condivide la stessa pipeline di trasformazione ESM e non richiede configurazione aggiuntiva di Babel. I test frontend utilizzano `jsdom` per simulare il browser.

### Debounce nei filtri
Il componente `SearchFilter` applica un debounce di 400 ms prima di propagare le modifiche al parent. Questo riduce il numero di chiamate API durante la digitazione e migliora l'esperienza utente su connessioni lente.

---

## 11. Deploy / produzione

### Build frontend

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Servire il frontend dal backend (opzionale)

Nel file `backend/server.js`, aggiungere prima del gestore 404:

```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
);
```

In questo modo un unico processo Node.js serve sia l'API sia la SPA.

### Variabili d'ambiente

| Variabile   | Default         | Descrizione                       |
|-------------|-----------------|-----------------------------------|
| `PORT`      | `5000`          | Porta del server Express          |
| `NODE_ENV`  | `development`   | `test` → DB in-memory per i test  |

---
