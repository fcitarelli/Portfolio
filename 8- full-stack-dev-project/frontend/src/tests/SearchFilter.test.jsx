/**
 * Test funzionali per il componente SearchFilter.
 * Il timer di rimbalzo è controllato con i falsi timer di Vitest.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import SearchFilter from '../components/SearchFilter';

const EMPTY = { search: '', author: '', year: '' };

describe('SearchFilter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('1. renders all three filter inputs', () => {
    render(<SearchFilter filters={EMPTY} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText(/cerca per titolo o abstract/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filtra per autore/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filtra per anno/i)).toBeInTheDocument();
  });

  test('2. inputs reflect the initial filters prop', () => {
    const filters = { search: 'hello', author: 'Rossi', year: '2021' };
    render(<SearchFilter filters={filters} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText(/cerca per titolo o abstract/i)).toHaveValue('hello');
    expect(screen.getByLabelText(/filtra per autore/i)).toHaveValue('Rossi');
  });

  test('3. propagates search change after debounce', async () => {
    const onChange = vi.fn();
    render(<SearchFilter filters={EMPTY} onFilterChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/cerca per titolo o abstract/i), { target: { value: 'machine' } });

    // Not called yet (debounce)
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'machine' }));

    await act(async () => { vi.advanceTimersByTime(500); });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'machine' }));
  });

  test('4. propagates author change after debounce', async () => {
    const onChange = vi.fn();
    render(<SearchFilter filters={EMPTY} onFilterChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/filtra per autore/i), { target: { value: 'Bianchi' } });
    await act(async () => { vi.advanceTimersByTime(500); });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ author: 'Bianchi' }));
  });

  test('5. propagates year change after debounce', async () => {
    const onChange = vi.fn();
    render(<SearchFilter filters={EMPTY} onFilterChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/filtra per anno/i), { target: { value: '2022' } });
    await act(async () => { vi.advanceTimersByTime(500); });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ year: '2022' }));
  });

  test('6. reset button appears only when at least one filter is set', async () => {
    const onChange = vi.fn();
    render(<SearchFilter filters={EMPTY} onFilterChange={onChange} />);

    // No filter → no reset button
    expect(screen.queryByLabelText(/azzera filtri/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/cerca per titolo o abstract/i), { target: { value: 'x' } });
    await act(async () => { vi.advanceTimersByTime(500); });

    expect(screen.getByLabelText(/azzera filtri/i)).toBeInTheDocument();
  });

  test('7. reset button clears all filters and calls onFilterChange with empty values', async () => {
    const onChange = vi.fn();
    render(
      <SearchFilter
        filters={{ search: 'deep', author: 'Rossi', year: '2020' }}
        onFilterChange={onChange}
      />
    );

    await act(async () => { vi.advanceTimersByTime(500); });
    onChange.mockClear();

    fireEvent.click(screen.getByLabelText(/azzera filtri/i));

    // Should immediately reset (not debounced)
    expect(onChange).toHaveBeenCalledWith(EMPTY);
  });
});
