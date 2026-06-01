// Canned backend responses shared by the E2E specs.

export const PROVIDERS = {
  models: [
    {
      id: 'openai/gpt-oss-120b',
      provider: 'groq',
      label: 'GPT-OSS 120B (Groq)',
      byok_only: false,
      recommended: true,
      notes: null,
    },
  ],
  default: 'openai/gpt-oss-120b',
};

export const GENERATED = {
  sql: 'SELECT count(*) AS well_count FROM Wells',
  explanation: {
    reasoning: ['Count the rows in the Wells table.'],
    sqlBreakdown: [{ part: 'count(*)', explanation: 'counts rows' }],
    concepts: ['aggregation'],
  },
  model: 'openai/gpt-oss-120b',
  provider: 'groq',
  attempts: 1,
};

export const STORY = {
  title: 'Test Lesson',
  context: 'A short scenario for the test.',
  difficulty: 'beginner',
  elements: ['well_locations', 'chemical_analysis'],
  skills: ['basic_select', 'joins'],
  steps: [
    {
      context: 'We need a few wells to start.',
      task: 'List five wells by id.',
      hint: 'Use the Wells table.',
      solution: 'SELECT Well_ID FROM Wells LIMIT 5',
      explanation: {
        overview: 'Selects five well ids.',
        steps: [{ sql: 'SELECT Well_ID', explanation: 'pick the id', key_concept: 'select' }],
      },
    },
  ],
};
