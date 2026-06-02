// Calls to the FastAPI backend that generates SQL. Execution stays in the
// browser (see src/db/duckdb.ts); this module only asks the backend to turn a
// question into SQL and to list the available models.

export interface SqlBreakdownItem {
  part: string;
  explanation: string;
}

export interface QueryExplanation {
  reasoning: string[];
  sqlBreakdown: SqlBreakdownItem[];
  concepts: string[];
}

export interface GenerateResponse {
  sql: string;
  explanation: QueryExplanation;
  model: string;
  provider: string;
  attempts: number;
}

export interface ModelInfo {
  id: string;
  provider: string;
  label: string;
  byok_only: boolean;
  recommended: boolean;
  notes?: string | null;
}

export interface ProvidersResponse {
  models: ModelInfo[];
  default: string;
}

// Defaults to the local dev backend; set VITE_API_URL for deployed builds.
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

// FastAPI puts error messages in a `detail` field. Surface that to the caller
// so the UI can show why a request failed (bad input, provider down, etc).
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') {
      return body.detail;
    }
  } catch {
    // fall through to the status text
  }
  return `${response.status} ${response.statusText}`;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    // fetch only rejects on a network-level failure (server down, DNS, CORS).
    throw new Error('Could not reach the server. Is the backend running?');
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response;
}

export async function getJSON<T>(path: string): Promise<T> {
  const response = await request(path);
  return response.json();
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

export function fetchProviders(): Promise<ProvidersResponse> {
  return getJSON<ProvidersResponse>('/providers');
}

export interface GenerateParams {
  question: string;
  model?: string;
  apiKey?: string;
}

export function generateQuery({ question, model, apiKey }: GenerateParams): Promise<GenerateResponse> {
  return postJSON<GenerateResponse>('/generate', { question, model, apiKey });
}
