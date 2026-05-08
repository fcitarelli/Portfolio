/**
 * Test funzionali per il componente PaperList.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PaperList from '../components/PaperList';
import * as api from '../services/api';

vi.mock('../services/api');

const PAPERS = [
  {
    id: 1,
    title: 'Deep Learning',
    authors: 'LeCun, Y.',
    abstract: 'A deep learning overview.',
    publication_date: '2015-01-01',
    doi: '10.1000/dl.001',
  },
  {
    id: 2,
    title: 'Transformer Models',
    authors: 'Vaswani, A.',
    abstract: '',
    publication_date: '2017-06-12',
    doi: '',
  },
];

const noop = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe('PaperList', () => {
  test('1. shows loading spinner when loading=true', () => {
    render(<PaperList papers={[]} loading={true} onView={noop} onEdit={noop} onRefresh={noop} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('2. shows empty-list message when no papers exist', () => {
    render(<PaperList papers={[]} loading={false} onView={noop} onEdit={noop} onRefresh={noop} />);
    expect(screen.getByTestId('empty-list')).toBeInTheDocument();
  });

  test('3. renders a card for each paper', () => {
    render(
      <PaperList papers={PAPERS} loading={false} onView={noop} onEdit={noop} onRefresh={noop} />
    );
    expect(screen.getAllByTestId('paper-card')).toHaveLength(2);
  });

  test('4. displays title and authors of each paper', () => {
    render(
      <PaperList papers={PAPERS} loading={false} onView={noop} onEdit={noop} onRefresh={noop} />
    );
    expect(screen.getByText('Deep Learning')).toBeInTheDocument();
    expect(screen.getByText('LeCun, Y.')).toBeInTheDocument();
    expect(screen.getByText('Transformer Models')).toBeInTheDocument();
  });

  test('5. calls onView with the correct paper when Dettagli is clicked', () => {
    const onView = vi.fn();
    render(
      <PaperList papers={PAPERS} loading={false} onView={onView} onEdit={noop} onRefresh={noop} />
    );
    // Click the first "Dettagli" button
    fireEvent.click(screen.getAllByText('Dettagli')[0]);
    expect(onView).toHaveBeenCalledWith(PAPERS[0]);
  });

  test('6. calls onEdit with the correct paper when Modifica is clicked', () => {
    const onEdit = vi.fn();
    render(
      <PaperList papers={PAPERS} loading={false} onView={noop} onEdit={onEdit} onRefresh={noop} />
    );
    fireEvent.click(screen.getAllByText('Modifica')[1]);
    expect(onEdit).toHaveBeenCalledWith(PAPERS[1]);
  });

  test('7. calls deletePaper and onRefresh when Elimina is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.deletePaper.mockResolvedValueOnce({ message: 'deleted' });
    const onRefresh = vi.fn();

    render(
      <PaperList
        papers={PAPERS}
        loading={false}
        onView={noop}
        onEdit={noop}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await vi.waitFor(() => expect(api.deletePaper).toHaveBeenCalledWith(PAPERS[0].id));
    await vi.waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });

  test('8. does NOT call deletePaper when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <PaperList papers={PAPERS} loading={false} onView={noop} onEdit={noop} onRefresh={noop} />
    );
    fireEvent.click(screen.getAllByText('Elimina')[0]);
    expect(api.deletePaper).not.toHaveBeenCalled();
  });
});
