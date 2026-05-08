/**
 * Test funzionali per il componente CitationPanel.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CitationPanel from '../components/CitationPanel';
import * as api from '../services/api';

vi.mock('../services/api');

const PAPER_ID = 10;

const CITATIONS = [
  { id: 1, paper_id: PAPER_ID, text: 'LeCun et al. 1989', authors: 'LeCun, Y.', year: 1989 },
  { id: 2, paper_id: PAPER_ID, text: 'Vaswani et al. 2017', authors: 'Vaswani, A.', year: 2017 },
];

const noop = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe('CitationPanel', () => {
  test('1. renders the citation count in the heading', () => {
    render(
      <CitationPanel paperId={PAPER_ID} citations={CITATIONS} onCitationsChange={noop} />
    );
    expect(screen.getByText(/citazioni \(2\)/i)).toBeInTheDocument();
  });

  test('2. renders all citations from the prop', () => {
    render(
      <CitationPanel paperId={PAPER_ID} citations={CITATIONS} onCitationsChange={noop} />
    );
    expect(screen.getAllByTestId('citation-item')).toHaveLength(2);
    expect(screen.getByText('LeCun et al. 1989')).toBeInTheDocument();
  });

  test('3. shows empty message when citations list is empty', () => {
    render(
      <CitationPanel paperId={PAPER_ID} citations={[]} onCitationsChange={noop} />
    );
    expect(screen.getByText(/nessuna citazione/i)).toBeInTheDocument();
  });

  test('4. shows validation error when trying to add empty citation', async () => {
    render(
      <CitationPanel paperId={PAPER_ID} citations={[]} onCitationsChange={noop} />
    );
    fireEvent.click(screen.getByRole('button', { name: /aggiungi citazione/i }));
    expect(await screen.findByText(/testo della citazione è obbligatorio/i)).toBeInTheDocument();
    expect(api.createCitation).not.toHaveBeenCalled();
  });

  test('5. calls createCitation and onCitationsChange on successful add', async () => {
    const newCitation = { id: 3, paper_id: PAPER_ID, text: 'New Ref', authors: '', year: null };
    api.createCitation.mockResolvedValueOnce(newCitation);
    const onCitationsChange = vi.fn();

    render(
      <CitationPanel
        paperId={PAPER_ID}
        citations={CITATIONS}
        onCitationsChange={onCitationsChange}
      />
    );

    await userEvent.type(screen.getByLabelText(/^testo/i), 'New Ref');
    fireEvent.click(screen.getByRole('button', { name: /aggiungi citazione/i }));

    await waitFor(() =>
      expect(api.createCitation).toHaveBeenCalledWith(PAPER_ID, expect.objectContaining({ text: 'New Ref' }))
    );
    await waitFor(() => expect(onCitationsChange).toHaveBeenCalled());
  });

  test('6. calls deleteCitation and onCitationsChange when delete is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.deleteCitation.mockResolvedValueOnce({ message: 'deleted' });
    const onCitationsChange = vi.fn();

    render(
      <CitationPanel
        paperId={PAPER_ID}
        citations={CITATIONS}
        onCitationsChange={onCitationsChange}
      />
    );

    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await waitFor(() => expect(api.deleteCitation).toHaveBeenCalledWith(CITATIONS[0].id));
    await waitFor(() => expect(onCitationsChange).toHaveBeenCalled());
  });

  test('7. does NOT delete when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <CitationPanel paperId={PAPER_ID} citations={CITATIONS} onCitationsChange={noop} />
    );
    fireEvent.click(screen.getAllByText('Elimina')[0]);
    expect(api.deleteCitation).not.toHaveBeenCalled();
  });
});
