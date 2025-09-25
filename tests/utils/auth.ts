import { expect, type Page } from '@playwright/test';
import { loginEmail, loginPassword } from './env';

export async function submitLoginForm(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input[name="email"]').fill(loginEmail);
  await page.locator('input[name="password"]').fill(loginPassword);
  await page.getByRole('button', { name: 'Login' }).click();
}

export async function loginAndEnterApplication(page: Page): Promise<void> {
  await submitLoginForm(page);
  const returnToAppLink = page.getByRole('link', { name: 'Return to Application' });
  await expect(returnToAppLink).toBeVisible();
  await returnToAppLink.click();
}
