import { postJSON } from './client';

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

// Story generators. These call the backend (POST /story), which builds the
// lesson from the selections and validates every solution as runnable SQL.
// Answer checking is no longer string-based: the browser executes the student's
// query and the reference solution and compares results (see src/db/grade.ts).
export interface StoryOptions {
  model?: string;
  apiKey?: string;
}

export function generateSingleStory(
  elements: string[],
  skills: string[],
  difficulty: Difficulty,
  options: StoryOptions = {}
): Promise<Story> {
  return postJSON<Story>('/story', {
    mode: 'single',
    elements,
    skills,
    difficulty,
    model: options.model,
    apiKey: options.apiKey,
  });
}

export function generateMultiChapterStory(
  elements: string[],
  skills: string[],
  difficulty: Difficulty,
  options: StoryOptions = {}
): Promise<MultiChapterStory> {
  return postJSON<MultiChapterStory>('/story', {
    mode: 'multi',
    elements,
    skills,
    difficulty,
    model: options.model,
    apiKey: options.apiKey,
  });
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