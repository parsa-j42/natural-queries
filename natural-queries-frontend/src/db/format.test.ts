import { describe, expect, it } from 'vitest';
import { formatCell } from './format';

describe('formatCell', () => {
  it('renders null and undefined as NULL', () => {
    expect(formatCell(null, 'Int32')).toBe('NULL');
    expect(formatCell(undefined, 'Utf8')).toBe('NULL');
  });

  it('stringifies BigInt (Arrow 64-bit ints)', () => {
    expect(formatCell(836589n, 'Int64')).toBe('836589');
  });

  it('formats a date-only timestamp without the time part', () => {
    const midnight = new Date('2023-10-15T00:00:00.000Z').getTime();
    expect(formatCell(midnight, 'Timestamp<MILLISECOND>')).toBe('2023-10-15');
  });

  it('formats a timestamp with a time component', () => {
    const ms = new Date('2023-10-15T13:45:30.000Z').getTime();
    expect(formatCell(ms, 'Timestamp<MILLISECOND>')).toBe('2023-10-15 13:45:30');
  });

  it('renders booleans as words', () => {
    expect(formatCell(true, 'Bool')).toBe('true');
    expect(formatCell(false, 'Bool')).toBe('false');
  });

  it('keeps finite numbers and nulls non-finite ones', () => {
    expect(formatCell(1.7, 'Float64')).toBe('1.7');
    expect(formatCell(Infinity, 'Float64')).toBe('NULL');
  });

  it('serializes objects, converting nested BigInt', () => {
    expect(formatCell({ n: 5n }, 'Struct')).toBe('{"n":"5"}');
  });
});
