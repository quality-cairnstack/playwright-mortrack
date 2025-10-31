import { test, expect } from '@playwright/test';
import { submitLoginForm } from './utils/auth';

test('user can log in', async ({ page }) => {
  await submitLoginForm(page);

  await expect(page.getByRole('link', { name: 'Return to Application' })).toBeVisible();
});