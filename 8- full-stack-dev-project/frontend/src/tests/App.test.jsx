/**
 * test a livello di integrazione per il componente principale dell'app.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import * as api from '../services/api';

vi.mock('../services/api');

const PAPERS = [
  {
    id: 1,
    title: 'Sample Paper',
    authors: 'Rossi, M.',
    abstract: 'An abstract.',
    publication_date: '2023-01-01',
    doi: '10.1000/sp.001',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.getPapers.mockResolvedValue(PAPERS);
});

describe('App navigation', () => {
  test('1. renders the header and paper list on initial load', async () => {
    render(<App />);
    expect(screen.getByText('📚 ScholarPort')).toBeInTheDocument();
    expect(await screen.findByText('Sample Paper')).toBeInTheDocument();
  });

  test('2. navigates to the add form when "+ Nuovo Articolo" is clicked', async () => {
    render(<App />);
    await screen.findByText('Sample Paper');

    fireEvent.click(screen.getByRole('button', { name: /nuovo articolo/i }));

    expect(screen.getByText(/nuovo articolo/i, { selector: 'h2' })).toBeInTheDocument();
  });

  test('3. navigates back to list when "Torna alla lista" is clicked', async () => {
    render(<App />);
    await screen.findByText('Sample Paper');

    fireEvent.click(screen.getByRole('button', { name: /nuovo articolo/i }));
    fireEvent.click(screen.getByRole('button', { name: /torna alla lista/i }));

    expect(await screen.findByText('Sample Paper')).toBeInTheDocument();
  });

  test('4. clicking the logo navigates back to list from add form', async () => {
    render(<App />);
    await screen.findByText('Sample Paper');

    fireEvent.click(screen.getByRole('button', { name: /nuovo articolo/i }));

    // Click on the logo / brand heading
    fireEvent.click(screen.getByRole('link', { hidden: true }) ?? screen.getByText('📚 ScholarPort'));

    expect(await screen.findByText('Sample Paper')).toBeInTheDocument();
  });

  test('5. navigates to edit form when Modifica is clicked', async () => {
    render(<App />);
    await screen.findByText('Sample Paper');

    fireEvent.click(screen.getByRole('button', { name: /modifica sample paper/i }));

    expect(screen.getByText(/modifica articolo/i, { selector: 'h2' })).toBeInTheDocument();
    // Pre-filled with existing paper data
    expect(screen.getByLabelText(/titolo/i)).toHaveValue('Sample Paper');
  });

  test('6. navigates to detail view when Dettagli is clicked', async () => {
    api.getPaper.mockResolvedValueOnce({ ...PAPERS[0], citations: [] });

    render(<App />);
    await screen.findByText('Sample Paper');

    fireEvent.click(screen.getByRole('button', { name: /visualizza sample paper/i }));

    await waitFor(() =>
      expect(api.getPaper).toHaveBeenCalledWith(PAPERS[0].id)
    );
  });
});
