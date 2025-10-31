import { expect, type Page } from '@playwright/test';

export interface CreatedCaseData {
  box_attributeID: string;
  codeID: string;
  liveqr: string | null;
  deceased_first: string | null;
  deceased_last: string | null;
}

function extractLiveqrFromMultipartBody(raw: string): string | null {
  try {
    if (!raw) return null;
    const marker = 'name="request"';
    const markerIdx = raw.indexOf(marker);
    if (markerIdx === -1) return null;
    const jsonStartBreak = raw.indexOf('\r\n\r\n', markerIdx);
    if (jsonStartBreak === -1) return null;
    const jsonStart = jsonStartBreak + 4;
    let jsonEnd = raw.indexOf('\r\n------', jsonStart);
    if (jsonEnd === -1) jsonEnd = raw.length;
    const jsonStr = raw.substring(jsonStart, jsonEnd).trim();
    const reqObj: any = JSON.parse(jsonStr);
    return (reqObj.liveqr ?? reqObj.liveQR ?? reqObj.LiveQR ?? null) || null;
  } catch {
    return null;
  }
}

export async function createCase(page: Page): Promise<CreatedCaseData> {
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
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();
  await saveButton.scrollIntoViewIfNeeded();

  const [req, resp] = await Promise.all([
    page.waitForRequest(
      r => r.url().includes('/app/unit/ajax_request_add') && r.method() === 'POST',
      { timeout: 15000 }
    ),
    page.waitForResponse(
      r => r.url().includes('/app/unit/ajax_request_add') && r.request().method() === 'POST',
      { timeout: 60000 }
    ),
    saveButton.click(),
  ]);

  // Resolve liveqr
  let liveqr: string | null = null;
  // Try JSON body
  try {
    const asJson: any = (req as any).postDataJSON?.();
    if (asJson) liveqr = asJson.liveqr ?? asJson.liveQR ?? asJson.LiveQR ?? null;
  } catch {}
  // Fallback: parse multipart
  if (!liveqr) {
    liveqr = extractLiveqrFromMultipartBody(req.postData() || '');
  }

  expect(resp.status()).toBe(200);
  const responseBody = await resp.json();
  expect(responseBody.success).toBe(true);
  const decedent = responseBody.result?.decedent;
  expect(decedent, 'Expected decedent payload in ajax_request_add response').toBeTruthy();

  const box_attributeID: string = String(decedent.box_attributeID);
  const codeID: string = String(decedent.codeID);
  const deceased_first: string | null = (decedent as any)?.deceased_first ?? null;
  const deceased_last: string | null = (decedent as any)?.deceased_last ?? null;
  if (!liveqr) liveqr = (decedent as any)?.LiveQR ?? (decedent as any)?.liveQR ?? (decedent as any)?.liveqr ?? null;

  await expect(page.getByText(/SUCCESS:New request submitted/i)).toBeVisible();

  return { box_attributeID, codeID, liveqr, deceased_first, deceased_last };
}

export async function cancelCase(page: Page, data: CreatedCaseData): Promise<void> {
  const cancelResponse = await page.context().request.post('/app/unit/ajax_request_update', {
    form: {
      box_attributeID: String(data.box_attributeID),
      codeID: String(data.codeID),
      reason: 'mm',
      'changes[0][name]': '3',
      'changes[0][old]': '',
      'changes[0][new]': '',
    },
  });

  expect(cancelResponse.status(), 'Cancel request should respond with 200').toBe(200);
  const cancelBody = await cancelResponse.json();
  expect(cancelBody.success).toBe(true);
}

