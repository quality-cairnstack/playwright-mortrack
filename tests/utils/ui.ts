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
  // Give the UI time to settle if the alert auto-hides and triggers layout changes
  try {
    await expect(alert).toBeHidden({ timeout: 15000 });
  } catch {
    // If it doesn't hide within 15s, continue without failing
  }
}

// Wait until at least one driver/vehicle option becomes visible in the assign dialog
export async function waitForDriverOptions(page: Page): Promise<void> {
  // Wait until the assign list is populated and at least one option is visible.
  // Some UIs render hidden placeholders first; select only visible ones.
  const visibleSelector = '.vehicle_profile:visible';
  try {
    await Promise.race([
      page.waitForResponse(
        r => r.url().includes('/ajax_get_drivers') && r.request().method() === 'POST' && r.ok(),
        { timeout: 30000 }
      ),
      page.waitForSelector(visibleSelector, { timeout: 30000 }),
    ]);
  } catch {
    // Even if the network listener misses, ensure at least one is visible before proceeding
    await page.waitForSelector(visibleSelector, { timeout: 30000 });
  }
  // Allow brief transition to finish
  await page.waitForTimeout(100);
}

export async function clickPreferredOrAnyDriver(page: Page): Promise<void> {
  // Prefer QA; otherwise click the first visible option.
  const qaVisible = page.locator('.vehicle_profile:visible').filter({ hasText: 'Quality Assurance' }).first();
  if (await qaVisible.count()) {
    await qaVisible.scrollIntoViewIfNeeded();
    await expect(qaVisible).toBeVisible();
    try {
      await qaVisible.click();
      return;
    } catch {}
  }
  const anyVisible = page.locator('.vehicle_profile:visible').first();
  await expect(anyVisible).toBeVisible({ timeout: 30000 });
  await anyVisible.scrollIntoViewIfNeeded();
  await anyVisible.click();
}

// Wait for the dispatcher "viewed" POST to complete (marks the request reviewed)
// Optionally filter by a specific box_attributeID when provided
export async function waitForDispatcherViewed(
  page: Page,
  boxAttributeId?: string,
  timeoutMs: number = 30000,
): Promise<void> {
  await page.waitForResponse((resp) => {
    if (!resp.url().includes('/app/unit/ajax_dispatcher_viewed')) return false;
    if (!resp.ok()) return false;
    if (boxAttributeId) {
      try {
        const body = resp.request().postData() || '';
        const match = /box_attributeID=([^&]+)/.exec(body);
        const value = match ? decodeURIComponent(match[1]) : undefined;
        return value === String(boxAttributeId);
      } catch {
        return false;
      }
    }
    return true;
  }, { timeout: timeoutMs });
  // Brief idle wait to allow UI to refresh bindings after the server acknowledges
  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {}
}
