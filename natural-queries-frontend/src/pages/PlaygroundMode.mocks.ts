// Seed data for the Playground's query-history panel. The NL-to-SQL generation
// and its explanation are now real (see src/API/client.ts -> POST /generate);
// these are just example questions to populate the history on first load.

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
