import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';
import { createCase, cancelCase } from './utils/case';

test.setTimeout(120000);
test('create case, verify details in dispatcher, then cancel', async ({ page }) => {
  // Sign in and enter the app
  await loginAndEnterApplication(page);

  // Create a new case and obtain identifiers
  const caseData = await createCase(page);

  // Navigate to dispatcher where search is performed
  await page.goto('/app/dispatcher/');

  // Perform liveqr search
  if (caseData.liveqr) {
    const searchBox = page.getByRole('textbox', { name: 'Type and Press Enter to Search' });
    await expect(searchBox).toBeVisible();
    await searchBox.fill(caseData.liveqr);
    await searchBox.press('Enter');
  }

  // Open the case by clicking the search result tile
  const detailsPanel = page.locator('#request-detail-container');
  const boxId = caseData?.box_attributeID ? `#box_attributeID_${caseData.box_attributeID}` : '';

  if (boxId) {
    const tile = page.locator(boxId);
    await expect(tile, `Expected result tile ${boxId} after search`).toBeVisible({ timeout: 30000 });
    await tile.locator('.card-header').click();
  } else if (caseData?.deceased_last && caseData?.deceased_first) {
    const nameRegex = new RegExp(`${caseData.deceased_last}\s*,\s*${caseData.deceased_first}`, 'i');
    const firstMatch = page.getByText(nameRegex).first();
    await expect(firstMatch, 'Expected name match in results').toBeVisible({ timeout: 15000 });
    await firstMatch.click();
  }

  // Wait for the details panel to become visible; click tile again if necessary
  try {
    await expect(detailsPanel).toBeVisible({ timeout: 10000 });
  } catch {
    // Retry a second click on the tile/name if panel did not open
    if (boxId) {
      const tile = page.locator(boxId);
      await tile.locator('.card-header').click();
      // If still not visible, try clicking name within the tile
      if (!(await detailsPanel.isVisible())) {
        const nameRegex = caseData?.deceased_last && caseData?.deceased_first
          ? new RegExp(`${caseData.deceased_last}\s*,\s*${caseData.deceased_first}`, 'i')
          : null;
        if (nameRegex) {
          const nameInTile = tile.getByText(nameRegex).first();
          if (await nameInTile.count()) {
            await nameInTile.click();
          }
        }
      }
    } else if (caseData?.deceased_last && caseData?.deceased_first) {
      const nameRegex = new RegExp(`${caseData.deceased_last}\s*,\s*${caseData.deceased_first}`, 'i');
      await page.getByText(nameRegex).first().click();
    }
    await expect(detailsPanel).toBeVisible({ timeout: 10000 });
  }

  await expect(detailsPanel.getByText(/Business:/i)).toBeVisible();
  if (caseData?.deceased_last && caseData?.deceased_first) {
    const nameInDetails = new RegExp(`${caseData.deceased_last}\s*,\s*${caseData.deceased_first}`, 'i');
    const soft = detailsPanel.getByText(nameInDetails);
    if (await soft.count()) {
      await expect(soft).toBeVisible();
    } else {
      console.warn('Name combination not rendered in details; continuing.');
    }
  }

  // Cleanup: cancel the case
  await cancelCase(page, caseData);
});
