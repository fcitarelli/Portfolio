/**
 * Test funzionali per il componente PaperForm.
 * Le chiamate API vengono simulate in modo che i test non raggiungano mai la rete.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PaperForm from '../components/PaperForm';
import * as api from '../services/api';

// Mock the api module
vi.mock('../services/api');

const onSuccess = vi.fn();
const onCancel  = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaperForm – creation mode', () => {
  test('1. renders all form fields in create mode', () => {
    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);

    expect(screen.getByLabelText(/titolo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/autori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/abstract/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data di pubblicazione/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/doi/i)).toBeInTheDocument();
  });

  test('2. shows validation error when title is empty on submit', async () => {
    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /crea articolo/i }));

    expect(await screen.findByText(/titolo è obbligatorio/i)).toBeInTheDocument();
    expect(api.createPaper).not.toHaveBeenCalled();
  });

  test('3. shows validation error when authors are empty on submit', async () => {
    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);

    await userEvent.type(screen.getByLabelText(/titolo/i), 'My Paper');
    fireEvent.click(screen.getByRole('button', { name: /crea articolo/i }));

    expect(await screen.findByText(/autori sono obbligatori/i)).toBeInTheDocument();
  });

  test('4. calls createPaper and onSuccess when form is valid', async () => {
    api.createPaper.mockResolvedValueOnce({ id: 1, title: 'Test', authors: 'A' });

    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);

    await userEvent.type(screen.getByLabelText(/titolo/i), 'Test Paper');
    await userEvent.type(screen.getByLabelText(/autori/i), 'Rossi, M.');
    fireEvent.click(screen.getByRole('button', { name: /crea articolo/i }));

    await waitFor(() => expect(api.createPaper).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  test('5. calls onCancel when Annulla button is clicked', () => {
    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /annulla/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('6. shows server error message when API call fails', async () => {
    api.createPaper.mockRejectedValueOnce(new Error('Server error'));

    render(<PaperForm paper={null} onSuccess={onSuccess} onCancel={onCancel} />);

    await userEvent.type(screen.getByLabelText(/titolo/i), 'Test');
    await userEvent.type(screen.getByLabelText(/autori/i), 'Author');
    fireEvent.click(screen.getByRole('button', { name: /crea articolo/i }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('PaperForm – edit mode', () => {
  const existingPaper = {
    id: 42,
    title: 'Existing Title',
    authors: 'Existing Author',
    abstract: 'Existing abstract',
    publication_date: '2022-05-10',
    doi: '10.1000/existing.001',
  };

  test('7. pre-fills fields with existing paper data', () => {
    render(
      <PaperForm paper={existingPaper} onSuccess={onSuccess} onCancel={onCancel} />
    );
    expect(screen.getByLabelText(/titolo/i)).toHaveValue('Existing Title');
    expect(screen.getByLabelText(/autori/i)).toHaveValue('Existing Author');
  });

  test('8. calls updatePaper (not createPaper) when submitting in edit mode', async () => {
    api.updatePaper.mockResolvedValueOnce({ ...existingPaper, title: 'Updated' });

    render(
      <PaperForm paper={existingPaper} onSuccess={onSuccess} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByRole('button', { name: /aggiorna/i }));

    await waitFor(() => expect(api.updatePaper).toHaveBeenCalledWith(42, expect.any(Object)));
    expect(api.createPaper).not.toHaveBeenCalled();
  });
});
