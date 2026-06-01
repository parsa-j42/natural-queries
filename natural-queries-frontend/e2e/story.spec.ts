import { expect, test } from '@playwright/test';
import { PROVIDERS, STORY } from './fixtures';

test('Story mode generates a lesson and grades a correct answer', async ({ page }) => {
  await page.route('**/providers', (route) => route.fulfill({ json: PROVIDERS }));
  await page.route('**/story', (route) => route.fulfill({ json: STORY }));

  await page.goto('/story');

  // Random Selection fills the required elements/skills, enabling generation.
  // Both tab panels render the same buttons; the first (visible) one is fine.
  await page.getByRole('button', { name: 'Random Selection' }).first().click();
  await page.getByRole('button', { name: 'Generate Story' }).first().click();

  await expect(page.getByText('List five wells by id.')).toBeVisible();

  // Answer with the reference solution: grading runs both queries in DuckDB-WASM
  // and compares result sets, so an exact match must grade as correct.
  await page
    .getByPlaceholder(/Write your SQL query here/i)
    .fill('SELECT Well_ID FROM Wells LIMIT 5');
  await page.getByRole('button', { name: 'Execute Query' }).click();

  await expect(page.getByText('Correct!')).toBeVisible({ timeout: 30_000 });
});
