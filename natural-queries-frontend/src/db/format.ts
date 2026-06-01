// Turn the JS values DuckDB-WASM hands back (via Arrow) into display strings.
// Arrow gives BigInt for 64-bit ints, epoch numbers for timestamps, and typed
// arrays for the odd column, none of which React can render directly.

const isTimestamp = (type: string) => type.startsWith('Timestamp');
const isDate = (type: string) => type.startsWith('Date');

function formatTemporal(value: unknown): string {
  const ms = typeof value === 'bigint' ? Number(value) : (value as number);
  const date = value instanceof Date ? value : new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  // Date-only and midnight timestamps read better without a time component.
  const iso = date.toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.replace('T', ' ').slice(0, 19);
}

export function formatCell(value: unknown, type: string): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (isTimestamp(type) || isDate(type)) {
    return formatTemporal(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? val.toString() : val));
  }
  return String(value);
}
