import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { ResultsColumn, ResultsPanel } from './ResultsPanel';

interface Row {
  Well_ID: number;
  Material: string;
}

const columns: ResultsColumn<Row>[] = [
  { key: 'Well_ID', header: 'Well_ID' },
  { key: 'Material', header: 'Material', render: (row) => row.Material.toUpperCase() },
];

const rows: Row[] = [
  { Well_ID: 1, Material: 'sand' },
  { Well_ID: 2, Material: 'clay' },
];

describe('ResultsPanel', () => {
  it('renders headers, the row count, and cells (with custom renderers)', () => {
    render(<ResultsPanel rows={rows} columns={columns} />);

    expect(screen.getByText('Well_ID')).toBeInTheDocument();
    expect(screen.getByText('2 Records Found')).toBeInTheDocument();
    // Custom renderer uppercases the material.
    expect(screen.getByText('SAND')).toBeInTheDocument();
    expect(screen.getByText('CLAY')).toBeInTheDocument();
  });

  it('shows a close button only when onClose is given, and calls it', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<ResultsPanel rows={rows} columns={columns} />);
    expect(screen.queryByLabelText('Hide results')).not.toBeInTheDocument();

    rerender(<ResultsPanel rows={rows} columns={columns} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('Hide results'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
