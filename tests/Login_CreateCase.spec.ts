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
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).press('ArrowDown');
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).press('Enter');
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).fill('last');
  await page.getByRole('textbox', { name: 'DECEDENT FIRST NAME*' }).click();
  await page.getByRole('textbox', { name: 'DECEDENT FIRST NAME*' }).fill('first');
  await page.getByRole('button', { name: 'PRIORITY' }).click();
  await page.getByRole('option', { name: 'LOW' }).locator('div').first().click();
  await page.locator('#place_of_removal').getByRole('button', { name: /COUNTRY\*/ }).click();
  await page
  .locator('.v-menu__content.menuable__content__active')
  .getByRole('option', { name: 'United States', exact: true })
  .click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'ADDRESS*' }).fill('123 main st');
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'CITY*' }).click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'CITY*' }).fill('city');
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'STATE*' }).click();
  await page.getByText('Alabama').click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'ZIP*' }).click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'ZIP*' }).fill('1234567');
  await page.getByRole('textbox', { name: 'ON-SITE CONTACT', exact: true }).click();
  await page.getByRole('textbox', { name: 'ON-SITE CONTACT', exact: true }).fill('Full name');
  const [resp] = await Promise.all([
    page.waitForResponse(r =>
      r.url().includes('/app/unit/ajax_request_add') &&
      r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  // Assert network call succeeded and payload indicates success
  expect(resp.status()).toBe(200);
  const bodyText = await resp.text();
  expect(bodyText.toLowerCase()).toContain('success');

  // Assert success toast appears
  await expect(page.getByText(/SUCCESS:New request submitted/i)).toBeVisible();
});
