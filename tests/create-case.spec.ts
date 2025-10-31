import { test, expect } from '@playwright/test';
import { loginAndEnterApplication } from './utils/auth';
import { createCase, cancelCase } from './utils/case';

test.use({ video: 'on' });
test.setTimeout(120000);

test('user can create and then cancel a case', async ({ page }) => {
  // Extra diagnostics in CI logs
  page.on('console', msg => console.log(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log('[pageerror]', err));
  page.on('requestfailed', req => console.log('[requestfailed]', req.method(), req.url(), req.failure()?.errorText));

  await loginAndEnterApplication(page);

  const created = await createCase(page);
  await cancelCase(page, created);
});
