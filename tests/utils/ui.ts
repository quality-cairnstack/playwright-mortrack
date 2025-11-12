import { expect, type Page } from '@playwright/test';

// Wait until the "Request Reviewed" success alert is actually shown (visible).
// This avoids passing early when the DOM node exists but is hidden by CSS.
export async function waitForRequestReviewedAlert(page: Page): Promise<void> {
  const alert = page.locator('#system-alert');
  const title = alert.locator('#system-alertTitle');
  const message = alert.locator('#system-alertMessage');
  await expect(alert).toBeVisible({ timeout: 30000 });
  await expect(title).toContainText(/SUCCESS:/i);
  await expect(message).toContainText(/Request Reviewed/i);
}
