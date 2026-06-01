import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gradeQuery } from './grade';
import { runQuery } from './duckdb';

// DuckDB-WASM cannot run in jsdom, so we mock the query layer and drive
// gradeQuery's branches by controlling what each call returns. The real engine
// is exercised by the Playwright E2E tests.
vi.mock('./duckdb', () => ({ runQuery: vi.fn() }));

const runQueryMock = vi.mocked(runQuery);

const cols = (n: number) => ({
  columns: Array.from({ length: n }, (_, i) => ({ name: `c${i}`, type: 'x' })),
  rows: [],
});

const compareRow = (only_student: number, only_solution: number, n_student: number, n_solution: number) => ({
  columns: [],
  rows: [
    {
      only_student: BigInt(only_student),
      only_solution: BigInt(only_solution),
      n_student: BigInt(n_student),
      n_solution: BigInt(n_solution),
    },
  ],
});

beforeEach(() => {
  runQueryMock.mockReset();
});

describe('gradeQuery', () => {
  it('marks identical result sets correct', async () => {
    runQueryMock
      .mockResolvedValueOnce(cols(2)) // student column count
      .mockResolvedValueOnce(cols(2)) // solution column count
      .mockResolvedValueOnce(compareRow(0, 0, 5, 5)); // comparison

    const result = await gradeQuery('SELECT a, b FROM Wells', 'SELECT a, b FROM Wells');
    expect(result.correct).toBe(true);
    expect(result.feedback).toMatch(/match/i);
  });

  it('reports a column-count mismatch', async () => {
    runQueryMock.mockResolvedValueOnce(cols(1)).mockResolvedValueOnce(cols(2));

    const result = await gradeQuery('SELECT a FROM Wells', 'SELECT a, b FROM Wells');
    expect(result.correct).toBe(false);
    expect(result.feedback).toMatch(/column/i);
  });

  it('reports a query that does not run', async () => {
    runQueryMock.mockRejectedValueOnce(new Error('Catalog Error: no such table'));

    const result = await gradeQuery('SELECT * FROM Nope', 'SELECT a FROM Wells');
    expect(result.correct).toBe(false);
    expect(result.feedback).toMatch(/did not run/i);
  });

  it('flags right row count but wrong values', async () => {
    runQueryMock
      .mockResolvedValueOnce(cols(2))
      .mockResolvedValueOnce(cols(2))
      .mockResolvedValueOnce(compareRow(3, 3, 5, 5));

    const result = await gradeQuery('SELECT a, b FROM Wells', 'SELECT a, b FROM Wells WHERE x');
    expect(result.correct).toBe(false);
    expect(result.feedback).toMatch(/right number of rows/i);
  });

  it('flags an empty result set', async () => {
    runQueryMock
      .mockResolvedValueOnce(cols(1))
      .mockResolvedValueOnce(cols(1))
      .mockResolvedValueOnce(compareRow(0, 4, 0, 4));

    const result = await gradeQuery('SELECT a FROM Wells WHERE false', 'SELECT a FROM Wells');
    expect(result.correct).toBe(false);
    expect(result.feedback).toMatch(/no rows/i);
  });
});
