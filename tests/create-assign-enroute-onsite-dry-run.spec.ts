import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';
import { createCase } from './utils/case';
import { waitForRequestReviewedAlert } from './utils/ui';

test.setTimeout(180000);
test('create, assign, run to dry-run and verify timestamps', async ({ page }) => {
  // Sign in
  await loginAndEnterApplication(page);

  // Create a new case and capture identifiers
  const caseData = await createCase(page);

  // Go to dispatcher, locate and open the created case
  await page.goto('/app/dispatcher/');

  if (caseData.liveqr) {
    const searchBox = page.getByRole('textbox', { name: 'Type and Press Enter to Search' });
    await expect(searchBox).toBeVisible();
    await searchBox.fill(caseData.liveqr);
    await searchBox.press('Enter');
  }

  const detailsPanel = page.locator('#request-detail-container');
  const tileSelector = `#box_attributeID_${caseData.box_attributeID}`;
  const tile = page.locator(tileSelector);
  await expect(tile, `Expected case tile ${tileSelector}`).toBeVisible({ timeout: 30000 });
  await tile.locator('.card-header').click();
  // Only for the first interaction with the case: wait for system alert
  await waitForRequestReviewedAlert(page);
  await expect(detailsPanel).toBeVisible();

  // Assign a Removal Tech (prefer the QA account when available)
  const assignBtn = detailsPanel.getByRole('button', { name: /Assign Removal Tech/i });
  await expect(assignBtn).toBeVisible();
  await assignBtn.click();

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

  // Go to the driver/assignments view to run the case
  const driverLink = page.getByRole('link', { name: // });
  if (await driverLink.count()) {
    await driverLink.click();
  } else {
    // Fallback: try an alternative nav label if present
    const fallbackDriver = page.getByRole('link', { name: /Driver|Assignments|Assigned/i }).first();
    if (await fallbackDriver.count()) await fallbackDriver.click();
  }

  // Open the row for this case using the dynamic box_attributeID
  const driverRow = page.locator(`#tr_${caseData.box_attributeID}`);
  await expect(driverRow).toBeVisible({ timeout: 60000 });
  const assignedCell = driverRow.getByRole('cell', { name: /Assigned/i });
  if (await assignedCell.count()) {
    await assignedCell.click();
  } else {
    await driverRow.click();
  }

  // Run through the flow: Accept -> En Route -> Call Complete -> On Site -> Dry Run
  await expect(page.getByRole('button', { name: /ACCEPT ASSIGNMENT/i })).toBeVisible();
  await page.getByRole('button', { name: /ACCEPT ASSIGNMENT/i }).click();

  await expect(page.getByRole('button', { name: /EN ROUTE/i })).toBeVisible();
  await page.getByRole('button', { name: /EN ROUTE/i }).click();

  const callComplete = page.getByRole('button', { name: /Call\s*Complete/i });
  if (await callComplete.count()) {
    await callComplete.click();
  }

  await expect(page.getByRole('button', { name: /ON SITE/i })).toBeVisible();
  await page.getByRole('button', { name: /ON SITE/i }).click();

  const dryRunBtn = page.getByRole('button', { name: /Cancel\/Dry Run/i });
  await expect(dryRunBtn).toBeVisible();
  await dryRunBtn.click();
  const confirmDryRunYes = page.locator('#btn_dry_run_confirm');
  await expect(confirmDryRunYes).toBeVisible();
  await confirmDryRunYes.click();

  // Return to Dispatcher and open the same case details again
  const dispatchBack = page.getByRole('listitem', { name: 'Dispatch' }).getByRole('link');
  if (await dispatchBack.count()) await dispatchBack.click();
  await page.goto('/app/dispatcher/');

  if (caseData.liveqr) {
    const searchBox = page.getByRole('textbox', { name: 'Type and Press Enter to Search' });
    if (await searchBox.isVisible()) {
      await searchBox.fill(caseData.liveqr);
      await searchBox.press('Enter');
    }
  }

  await expect(tile).toBeVisible({ timeout: 30000 });
  await tile.locator('.card-header').click();
  await expect(detailsPanel).toBeVisible();

  // Confirm timestamps exist within the scrollable details panel
  const history = detailsPanel.locator('section.history');
  await expect(history).toBeVisible({ timeout: 15000 });

  // Scroll the side panel to the given status row by CSS class
  const scrollStatusIntoView = async (statusClass: string) => {
    const found = await detailsPanel.evaluate((panel, cls) => {
      const historyEl = panel.querySelector('section.history');
      if (!historyEl) return false;
      const row = historyEl.querySelector(`.row.status.${cls}`) as HTMLElement | null;
      if (!row) return false;
      (panel as HTMLElement).scrollTo({ top: Math.max(0, row.offsetTop - 20) });
      return true;
    }, statusClass);
    expect(found, `Expected to find history row .row.status.${statusClass}`).toBeTruthy();
  };

  // Use row classes to avoid text-format variability and <br> differences
  const statusClasses = ['assigned', 'accepted', 'en_route', 'on_site', 'dry_run'];
  for (const cls of statusClasses) {
    await scrollStatusIntoView(cls);
    const row = history.locator(`.row.status.${cls}`).first();
    // Poll until the timestamp shows real data (contains a digit, not just ...)
    await expect.poll(async () => {
      try {
        const txt = await row.locator('.timestamp').innerText();
        return txt.replace(/\s+/g, ' ').trim();
      } catch {
        return '';
      }
    }, { timeout: 30000, message: `Waiting for timestamp in .row.status.${cls}` }).toMatch(/\d/);
  }
});
