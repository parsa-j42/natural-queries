// Client-side stand-ins for the query backend. These fake the NL-to-SQL generation,
// the explanation, and the execution results so the UI is demoable. Swap each of these
// for real API calls once the backend lands.

export interface WellResult {
  Well_ID: number;
  Chemical_Analysis_ID: number;
  Sample_Date: string;
  Value: number;
  Element_Name: string;
  Latitude: number;
  Longitude: number;
}

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
    natural: 'Show me wells with high iron content in the last year',
    sql: 'SELECT W.Well_ID, CA.Sample_Date, AI.Value FROM Wells W JOIN Chemical_Analysis CA...',
  },
  {
    natural: 'Find wells with recent chemical analyses in Calgary',
    sql: 'SELECT W.Well_ID, CA.Sample_Date FROM Wells W JOIN Chemical_Analysis CA...',
  },
];

const EMPTY_EXPLANATION: QueryExplanation = {
  reasoning: [],
  sqlBreakdown: [],
  concepts: [],
};

// Only the "iron content" example is wired up for the demo.
const matchesIronExample = (query: string) => query.toLowerCase().includes('iron content');

export function generateSQL(query: string): string {
  if (!matchesIronExample(query)) {
    return '';
  }

  return `
SELECT
  W.Well_ID,
  W.Latitude,
  W.Longitude,
  CA.Chemical_Analysis_ID,
  CA.Sample_Date,
  AI.Value,
  AI.Element_Name
FROM Wells W
JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID
JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID
WHERE
  AI.Element_Name = 'Iron'
  AND AI.Value > 0.3  -- Standard threshold for iron content
  AND CA.Sample_Date >= DATEADD(year, -1, GETDATE())
ORDER BY
  CA.Sample_Date DESC;`.trim();
}

export function generateExplanation(query: string): QueryExplanation {
  if (!matchesIronExample(query)) {
    return EMPTY_EXPLANATION;
  }

  return {
    reasoning: [
      "We'll need to join three tables to get this information:",
      '1. Wells table for location data',
      '2. Chemical_Analysis table for sample dates',
      '3. Analysis_Items table for iron measurements',
    ],
    sqlBreakdown: [
      {
        part: 'SELECT W.Well_ID, W.Latitude, W.Longitude, ...',
        explanation: 'Getting well location and identification data',
      },
      {
        part: 'JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID',
        explanation: 'Connecting wells to their chemical analyses using Well_ID',
      },
      {
        part: 'JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID',
        explanation: 'Connecting to specific chemical measurements using Chemical_Analysis_ID',
      },
      {
        part: "WHERE AI.Element_Name = 'Iron' AND AI.Value > 0.3",
        explanation: 'Filtering for iron content above the standard threshold (0.3 mg/L)',
      },
    ],
    concepts: [
      'Multi-table JOIN operations',
      'Date-based filtering',
      'Chemical analysis thresholds',
      'Result ordering by date',
    ],
  };
}

export function getMockResults(query: string): WellResult[] {
  if (!matchesIronExample(query)) {
    return [];
  }

  return [
    {
      Well_ID: 1001,
      Chemical_Analysis_ID: 5001,
      Sample_Date: '2023-10-15',
      Value: 0.45,
      Element_Name: 'Iron',
      Latitude: 51.0447,
      Longitude: -114.0719,
    },
    {
      Well_ID: 1002,
      Chemical_Analysis_ID: 5002,
      Sample_Date: '2023-09-20',
      Value: 0.52,
      Element_Name: 'Iron',
      Latitude: 51.0544,
      Longitude: -114.0667,
    },
  ];
}
