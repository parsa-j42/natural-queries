import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateMultiChapterStory,
  generateSingleStory,
  getRandomSelection,
} from './StoryModeAPI';

function mockFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StoryModeAPI', () => {
  it('generateSingleStory posts mode "single" with the selections and options', async () => {
    const fetchMock = mockFetch({ title: 'X' });

    await generateSingleStory(['well_locations'], ['joins'], 'beginner', {
      model: 'm',
      apiKey: 'k',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/story');
    expect(JSON.parse(init.body)).toEqual({
      mode: 'single',
      elements: ['well_locations'],
      skills: ['joins'],
      difficulty: 'beginner',
      model: 'm',
      apiKey: 'k',
    });
  });

  it('generateMultiChapterStory posts mode "multi"', async () => {
    const fetchMock = mockFetch({ title: 'X' });

    await generateMultiChapterStory(['chemical_analysis'], ['aggregates'], 'advanced');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.mode).toBe('multi');
    expect(body.difficulty).toBe('advanced');
    expect(body.model).toBeUndefined();
  });

  it('getRandomSelection returns beginner defaults', () => {
    expect(getRandomSelection('beginner')).toEqual({
      elements: ['well_locations', 'chemical_analysis'],
      skills: ['basic_select', 'joins'],
    });
  });
});
