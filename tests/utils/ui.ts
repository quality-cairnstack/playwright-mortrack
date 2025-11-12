import { expect, type Page } from '@playwright/test';

// Waits until the system alert message contains "Request Reviewed".
// Presence in the DOM is sufficient; visibility is not required.
export async function waitForRequestReviewedAlert(page: Page): Promise<void> {
  const alertMessage = page.locator('#system-alertMessage');
  await expect(alertMessage).toContainText(/Request Reviewed/i, { timeout: 30000 });
}

