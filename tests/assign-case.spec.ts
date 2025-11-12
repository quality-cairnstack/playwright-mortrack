import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';
import { createCase, cancelCase } from './utils/case';
import { waitForRequestReviewedAlert } from './utils/ui';

test.setTimeout(120000);
test('Assign a RT', async ({ page }) => {
  // Sign in and enter the app using shared utils
  await loginAndEnterApplication(page);

  // Create a new case via component util
  const caseData = await createCase(page);

  // Go to dispatcher to locate the created case
  await page.goto('/app/dispatcher/');

  // Search by liveqr if available for precise lookup
  if (caseData.liveqr) {
    const searchBox = page.getByRole('textbox', { name: 'Type and Press Enter to Search' });
    await expect(searchBox).toBeVisible();
    await searchBox.fill(caseData.liveqr);
    await searchBox.press('Enter');
  }

  // Open the case details panel
  const detailsPanel = page.locator('#request-detail-container');
  const boxId = caseData?.box_attributeID ? `#box_attributeID_${caseData.box_attributeID}` : '';

  if (boxId) {
    const tile = page.locator(boxId);
    await expect(tile, `Expected result tile ${boxId} after search`).toBeVisible({ timeout: 30000 });
    await tile.locator('.card-header').click();
  } else if (caseData?.deceased_last && caseData?.deceased_first) {
    const nameRegex = new RegExp(`${caseData.deceased_last}\\s*,\\s*${caseData.deceased_first}`, 'i');
    const firstMatch = page.getByText(nameRegex).first();
    await expect(firstMatch, 'Expected name match in results').toBeVisible({ timeout: 15000 });
    await firstMatch.click();
  }

  // Wait for the initial system alert to appear after opening the case
  await waitForRequestReviewedAlert(page);

  // Ensure the details panel is visible
  try {
    await expect(detailsPanel).toBeVisible({ timeout: 10000 });
  } catch {
    // Retry opening if it didn't show on first click
    if (boxId) {
      const tile = page.locator(boxId);
      await tile.locator('.card-header').click();
    }
    await expect(detailsPanel).toBeVisible({ timeout: 10000 });
  }

  // Assign a Removal Tech
  const assignBtn = detailsPanel.getByRole('button', { name: /Assign Removal Tech/i });
  await expect(assignBtn).toBeVisible();
  await assignBtn.click();

  // Choose a vehicle/driver (prefer the QA account when available)
  const qaOption = page.locator('.vehicle_profile', { hasText: 'Quality Assurance' }).first();
  const anyOption = page.locator('.vehicle_profile').first();
  if (await qaOption.count()) {
    await qaOption.click();
  } else {
    await expect(anyOption).toBeVisible();
    await anyOption.click();
  }

  const saveAlertBtn = page.getByRole('button', { name: /Save & Alert/i });
  await expect(saveAlertBtn).toBeVisible();
  await saveAlertBtn.click();

  // Verify that the assigned driver is displayed (QA preferred)
  await expect(detailsPanel.locator('#assigned-driver').getByText('Quality Assurance')).toBeVisible({ timeout: 30000 });

  // Cleanup: cancel the case using shared util
  await cancelCase(page, caseData);
});
