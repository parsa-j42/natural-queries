// Core Types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QueryExplanation {
  overview: string;
  steps: {
    sql: string;
    explanation: string;
    key_concept?: string;
  }[];
}

export interface StoryStep {
  context: string;
  task: string;
  hint: string;
  solution: string;
  explanation: QueryExplanation;
}

export interface Chapter {
  title: string;
  introduction: string;
  learning_objectives: string[];
  steps: StoryStep[];
  conclusion: string;
}

export interface Story {
  title: string;
  context: string;
  difficulty: Difficulty;
  elements: string[];
  skills: string[];
  steps: StoryStep[];
}

export interface MultiChapterStory {
  title: string;
  overall_context: string;
  difficulty: Difficulty;
  elements: string[];
  skills: string[];
  chapters: Chapter[];
}

// Available schema elements based on the actual database
export const schemaElements = [
  {
    value: 'well_locations',
    label: 'Well Locations',
  },
  {
    value: 'chemical_analysis',
    label: 'Chemical Analysis',
  },
  {
    value: 'well_ownership',
    label: 'Well Ownership',
  },
  {
    value: 'drilling_info',
    label: 'Drilling Information',
  },
  {
    value: 'water_quality',
    label: 'Water Quality Metrics',
  }
].map(item => ({
  ...item,
  description: '',
  tables: [],
}));

// Available SQL skills
export const sqlSkills = [
  {
    value: 'basic_select',
    label: 'Basic SELECT',
  },
  {
    value: 'joins',
    label: 'Table JOINs',
  },
  {
    value: 'aggregates',
    label: 'Aggregate Functions',
  },
  {
    value: 'complex_conditions',
    label: 'Complex Conditions',
  },
  {
    value: 'temporal_analysis',
    label: 'Temporal Analysis',
  }
].map(item => ({
  ...item,
  description: '',
  difficulty: 'beginner' as Difficulty,
}));

// Story generators. These are stubs that always return the beginner scenario today.
// The real backend will use the selections (elements/skills/difficulty) to pick or
// generate a story, -> the underscore-prefixed params we don't read yet.
export async function generateSingleStory(
  _elements: string[],
  _skills: string[],
  _difficulty: Difficulty
): Promise<Story> {
  return (await import('../pages/StoryModeScenarios')).StoryScenarios.singleStories.beginner[0];
}

export async function generateMultiChapterStory(
  _elements: string[],
  _skills: string[],
  _difficulty: Difficulty
): Promise<MultiChapterStory> {
  return (await import('../pages/StoryModeScenarios')).StoryScenarios.multiChapterStories
    .beginner[0] as MultiChapterStory;
}

export function validateQuery(query: string, solution: string): { isValid: boolean; feedback: string } {
  const normalizeSQL = (sql: string) => {
    return sql.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([,()])\s*/g, '$1')
      .trim();
  };

  const userNormalized = normalizeSQL(query);
  const solutionNormalized = normalizeSQL(solution);

  // Simple validation: check if main components are present
  const hasSelect = userNormalized.includes('select');
  const hasFrom = userNormalized.includes('from');
  const hasRequiredTables = solution.toLowerCase()
    .match(/from\s+([a-z_]+)/i)?.[1]
    ?.split(/[,\s]+/)
    .every(table => userNormalized.includes(table.toLowerCase()));

  if (!hasSelect || !hasFrom) {
    return {
      isValid: false,
      feedback: 'Make sure your query includes SELECT and FROM clauses.'
    };
  }

  if (!hasRequiredTables) {
    return {
      isValid: false,
      feedback: 'Check if you\'re using all the required tables.'
    };
  }

  // For prototype, be lenient with exact matching
  const isExactMatch = userNormalized === solutionNormalized;
  const isCloseMatch = solution.toLowerCase()
    .split(/[,\s]+/)
    .filter(word => word.length > 3)
    .every(word => userNormalized.includes(word.toLowerCase()));

  return {
    isValid: isExactMatch || isCloseMatch,
    feedback: isExactMatch
      ? 'Perfect! Your query matches the solution exactly.'
      : isCloseMatch
        ? 'Good job! Your query includes all the key elements.'
        : 'Almost there! Try comparing your query with the solution.'
  };
}

export function getRandomSelection(
  difficulty: Difficulty
): { elements: string[], skills: string[] } {
  // For prototype, always return the elements and skills needed for our mock stories
  if (difficulty === 'beginner') {
    return {
      elements: ['well_locations', 'chemical_analysis'],
      skills: ['basic_select', 'joins']
    };
  }
  return {
    elements: [],
    skills: []
  };
}