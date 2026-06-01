import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProviders, generateQuery } from './client';

function mockFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('client', () => {
  it('generateQuery posts the question and returns the parsed result', async () => {
    const payload = { sql: 'SELECT 1', explanation: { reasoning: [], sqlBreakdown: [], concepts: [] } };
    const fetchMock = mockFetch({ json: async () => payload });

    const result = await generateQuery({ question: 'how many wells?', model: 'm', apiKey: 'k' });

    expect(result).toEqual(payload);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/generate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ question: 'how many wells?', model: 'm', apiKey: 'k' });
  });

  it('fetchProviders calls /providers', async () => {
    const body = { models: [], default: 'openai/gpt-oss-120b' };
    const fetchMock = mockFetch({ json: async () => body });

    const result = await fetchProviders();

    expect(result).toEqual(body);
    expect(fetchMock.mock.calls[0][0]).toContain('/providers');
  });

  it('surfaces the FastAPI detail message on error', async () => {
    mockFetch({ ok: false, status: 422, json: async () => ({ detail: 'question must not be empty' }) });
    await expect(generateQuery({ question: '' })).rejects.toThrow('question must not be empty');
  });

  it('falls back to status text when there is no JSON body', async () => {
    mockFetch({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('not json');
      },
    });
    await expect(fetchProviders()).rejects.toThrow('502');
  });
});
