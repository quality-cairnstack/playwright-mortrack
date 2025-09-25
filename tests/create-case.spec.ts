import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';

test.use({ video: 'on' });

test('user can create a case', async ({ page }) => {
  await loginAndEnterApplication(page);

  await page.getByRole('link', { name: /Tz$/ }).click();
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).click();
  await page.getByRole('textbox', { name: 'REPRESENTING*' }).fill('lemley funeral hom');
  await page.getByRole('option', { name: /LEMLEY FUNERAL HOME/i }).first().click();
  await page.getByRole('textbox', { name: 'DECEDENT LAST NAME*' }).fill('last');
  await page.getByRole('textbox', { name: 'DECEDENT FIRST NAME*' }).fill('first');
  await page.getByRole('button', { name: 'PRIORITY' }).click();
  await page.getByRole('option', { name: 'LOW' }).locator('div').first().click();
  await page.locator('#place_of_removal').getByRole('button', { name: /COUNTRY\\*/ }).click();
  await page
    .locator('.v-menu__content.menuable__content__active')
    .getByRole('option', { name: 'United States', exact: true })
    .click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'ADDRESS*' }).fill('123 main st');
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'CITY*' }).fill('city');
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'STATE*' }).click();
  await page.getByText('Alabama').click();
  await page.locator('#place_of_removal').getByRole('textbox', { name: 'ZIP*' }).fill('1234567');
  await page.getByRole('textbox', { name: 'ON-SITE CONTACT', exact: true }).fill('Full name');

  const [resp] = await Promise.all([
    page.waitForResponse(
      r => r.url().includes('/app/unit/ajax_request_add') && r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  expect(resp.status()).toBe(200);
  const bodyText = await resp.text();
  expect(bodyText.toLowerCase()).toContain('success');

  await expect(page.getByText(/SUCCESS:New request submitted/i)).toBeVisible();
});