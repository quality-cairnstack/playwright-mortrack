import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';

test.use({ video: 'on' });

test('user can create a case', async ({ page }) => {
  await loginAndEnterApplication(page);

  await page.locator('a[href="/app/new_request"]').click();
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

  const saveButton = page.locator('#request_save_btn');
  await expect(saveButton).toHaveClass('btn_design save_btn v-btn v-btn--outlined theme--light v-size--default');
  await expect(saveButton).toBeEnabled();

  const requestPromise = page.waitForRequest(
    req => req.url().includes('/app/unit/ajax_request_add') && req.method() === 'POST',
    { timeout: 15000 }
  );
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/app/unit/ajax_request_add') && resp.request().method() === 'POST',
    { timeout: 60000 }
  );

  await saveButton.click();

  const request = await requestPromise;
  console.log('ajax_request_add request:', {
    url: request.url(),
    postData: request.postData(),
  });

  const resp = await responsePromise;

  expect(resp.status()).toBe(200);
  const bodyText = await resp.text();
  console.log('ajax_request_add response:', { status: resp.status(), body: bodyText });
  expect(bodyText.toLowerCase()).toContain('success');

  await expect(page.getByText(/SUCCESS:New request submitted/i)).toBeVisible();
});
