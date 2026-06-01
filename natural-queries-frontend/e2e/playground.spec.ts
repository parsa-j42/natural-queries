import { expect, test } from '@playwright/test';
import { GENERATED, PROVIDERS } from './fixtures';

test('Playground generates SQL and runs it in the browser', async ({ page }) => {
  await page.route('**/providers', (route) => route.fulfill({ json: PROVIDERS }));
  await page.route('**/generate', (route) => route.fulfill({ json: GENERATED }));

  await page.goto('/playground');

  await page
    .getByPlaceholder(/Describe what you want to know/i)
    .fill('how many wells are there?');
  await page.getByRole('button', { name: 'Generate SQL' }).click();

  // The SQL the backend "returned" lands in the editable SQL box.
  await expect(page.getByPlaceholder(/Write SQL here/i)).toHaveValue(
    /SELECT count\(\*\) AS well_count FROM Wells/
  );

  await page.getByRole('button', { name: 'Execute SQL Query' }).click();

  // Real DuckDB-WASM executed it against the Parquet: one row, one column.
  // The first query also has to download and boot the wasm engine, so allow time.
  await expect(page.getByText('well_count')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('1 Records Found')).toBeVisible();
});
