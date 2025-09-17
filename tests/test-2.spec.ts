import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://mortrack.app/auth/login');
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill('quality.assurance@mortrack.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('1324$leF');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Return to Application' }).click();
  await page.getByRole('link', { name: '' }).click();
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).click();
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).fill('lemley funeral home');
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).fill('last');
  await page.getByRole('textbox', { name: 'DECEDENT FIRST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT FIRST NAME*' }).fill('first');
  await page.getByRole('button', { name: 'PRIORITY' }).click();
  await page.getByRole('option', { name: 'LOW' }).locator('div').first().click();
  await page.getByRole('textbox', { name: 'REMOVAL LOCATION' }).click();
  await page.getByRole('textbox', { name: 'REMOVAL LOCATION' }).fill('123 main st');
  await page.getByText('Main StreetQueens, NY, USA').click();
  await page.getByRole('textbox', { name: 'ON-SITE CONTACT', exact: true }).click();
  await page.getByRole('textbox', { name: 'ON-SITE CONTACT', exact: true }).fill('Full name');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText('New request submitted').click({
    button: 'right'
  });
  await expect(page.getByText('SUCCESS:New request submitted')).toBeVisible();
});