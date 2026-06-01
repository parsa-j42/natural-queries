// Result-based grading for Story mode. Instead of comparing SQL text, we run the
// student's query and the reference solution in DuckDB-WASM and compare their
// result sets. The comparison happens inside the engine (set difference both
// ways) so we never pull large results into JS just to grade them.
import { runQuery } from './duckdb';

export interface GradeResult {
  correct: boolean;
  feedback: string;
}

const stripTrailing = (sql: string) => sql.trim().replace(/;\s*$/, '');

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

// Column count via a zero-row wrap, cheap and avoids fetching data.
async function columnCount(sql: string): Promise<number> {
  const result = await runQuery(`SELECT * FROM (${sql}) AS _q LIMIT 0`);
  return result.columns.length;
}

export async function gradeQuery(studentSQL: string, solutionSQL: string): Promise<GradeResult> {
  const student = stripTrailing(studentSQL);
  const solution = stripTrailing(solutionSQL);

  // Does the student's query run at all?
  let studentColumns: number;
  try {
    studentColumns = await columnCount(student);
  } catch (error) {
    return { correct: false, feedback: `Your query did not run: ${errorMessage(error)}` };
  }

  // The reference solution is validated server-side, but guard anyway.
  let solutionColumns: number;
  try {
    solutionColumns = await columnCount(solution);
  } catch {
    return { correct: false, feedback: 'Could not evaluate against the solution right now.' };
  }

  if (studentColumns !== solutionColumns) {
    return {
      correct: false,
      feedback: `Your query returns ${studentColumns} column${studentColumns === 1 ? '' : 's'}, but the solution has ${solutionColumns}. Check which columns you select.`,
    };
  }

  // EXCEPT ALL compares rows as a multiset and ignores ordering, so a different
  // ORDER BY still grades as correct as long as the rows match.
  const compare = `
    WITH _student AS (${student}), _solution AS (${solution})
    SELECT
      (SELECT count(*) FROM (SELECT * FROM _student EXCEPT ALL SELECT * FROM _solution)) AS only_student,
      (SELECT count(*) FROM (SELECT * FROM _solution EXCEPT ALL SELECT * FROM _student)) AS only_solution,
      (SELECT count(*) FROM _student) AS n_student,
      (SELECT count(*) FROM _solution) AS n_solution`;

  try {
    const { rows } = await runQuery(compare);
    const row = rows[0] ?? {};
    const onlyStudent = Number(row.only_student);
    const onlySolution = Number(row.only_solution);
    const nStudent = Number(row.n_student);
    const nSolution = Number(row.n_solution);

    if (onlyStudent === 0 && onlySolution === 0) {
      return { correct: true, feedback: 'Correct! Your results match the solution.' };
    }
    if (nStudent === 0) {
      return { correct: false, feedback: 'Your query returned no rows. Check your filters and joins.' };
    }
    if (nStudent === nSolution) {
      return {
        correct: false,
        feedback: `Right number of rows (${nStudent}), but the values differ. Compare your columns and filters with the task.`,
      };
    }
    return {
      correct: false,
      feedback: `Your results don't match yet. The solution returns ${nSolution} row${nSolution === 1 ? '' : 's'}; yours returns ${nStudent}.`,
    };
  } catch {
    // Columns line up in count but not in type, so EXCEPT could not compare them.
    return {
      correct: false,
      feedback: 'Your results could not be matched against the solution. Check your column types and selection.',
    };
  }
}
