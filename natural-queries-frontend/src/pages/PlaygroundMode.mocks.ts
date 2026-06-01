// Client-side stand-ins for the generation backend. These fake the NL-to-SQL
// step and its explanation so the Playground is demoable before Phase 3 lands.
// Execution is real: the SQL below runs in DuckDB-WASM against the actual data.
// Swap generateSQL/generateExplanation for the /generate API call in Phase 3.

export interface QueryExplanation {
  reasoning: string[];
  sqlBreakdown: { part: string; explanation: string }[];
  concepts: string[];
}

export interface RecentQuery {
  natural: string;
  sql: string;
}

export const recentQueries: RecentQuery[] = [
  {
    natural: 'Show me the wells with the highest iron content',
    sql: "SELECT w.Well_ID, ai.Value FROM Wells w JOIN Chemical_Analysis ca ... WHERE ai.Element_Symbol = 'FE'",
  },
  {
    natural: 'How many wells are there in each drilling method?',
    sql: 'SELECT Drilling_Method, count(*) FROM Well_Reports GROUP BY Drilling_Method',
  },
];

const EMPTY_EXPLANATION: QueryExplanation = {
  reasoning: [],
  sqlBreakdown: [],
  concepts: [],
};

// Only the "iron content" example is wired up for the demo.
const matchesIronExample = (query: string) => query.toLowerCase().includes('iron content');

// Valid DuckDB SQL over the built views. Iron is stored under the symbol 'FE'
// (field iron is 'F_FE'). The samples are historical, so this ranks by value
// rather than filtering on a recent date that would return nothing.
export function generateSQL(query: string): string {
  if (!matchesIronExample(query)) {
    return '';
  }

  return `
SELECT
  w.Well_ID,
  w.Latitude,
  w.Longitude,
  ca.Sample_Date,
  ai.Value AS Iron_mg_L
FROM Wells w
JOIN Chemical_Analysis ca ON ca.Well_ID = w.Well_ID
JOIN Analysis_Items ai ON ai.Chemical_Analysis_ID = ca.Chemical_Analysis_ID
WHERE ai.Element_Symbol = 'FE'
  AND ai.Value > 0.3            -- 0.3 mg/L is the common iron threshold
ORDER BY ai.Value DESC
LIMIT 100;`.trim();
}

export function generateExplanation(query: string): QueryExplanation {
  if (!matchesIronExample(query)) {
    return EMPTY_EXPLANATION;
  }

  return {
    reasoning: [
      "We'll join three tables to get this information:",
      '1. Wells for location data',
      '2. Chemical_Analysis for the sample each measurement belongs to',
      '3. Analysis_Items for the iron measurements themselves',
    ],
    sqlBreakdown: [
      {
        part: 'SELECT w.Well_ID, w.Latitude, w.Longitude, ...',
        explanation: 'Getting well location and identification data',
      },
      {
        part: 'JOIN Chemical_Analysis ca ON ca.Well_ID = w.Well_ID',
        explanation: 'Connecting wells to their chemical analyses using Well_ID',
      },
      {
        part: 'JOIN Analysis_Items ai ON ai.Chemical_Analysis_ID = ca.Chemical_Analysis_ID',
        explanation: 'Connecting to the individual measurements using Chemical_Analysis_ID',
      },
      {
        part: "WHERE ai.Element_Symbol = 'FE' AND ai.Value > 0.3",
        explanation: 'Filtering for iron measurements above the standard threshold (0.3 mg/L)',
      },
    ],
    concepts: [
      'Multi-table JOIN operations',
      'Filtering by element symbol',
      'Numeric thresholds',
      'Result ordering and limiting',
    ],
  };
}
