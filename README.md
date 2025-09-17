# Mortrack Playwright

End-to-end (E2E) tests for the Mortrack application, runnable locally and on CI. The suite is designed to run every 30 minutes and notify you by email if any test fails.

## Project Aim
- Validate critical Mortrack user flows with Playwright.
- Run tests on a schedule (every 30 minutes) automatically.
- Send an email with logs and the HTML report zipped whenever a run fails.

## Repo Overview
- `tests/`: Playwright test specs.
- `playwright.config.ts`: Playwright configuration.
- `scripts/run-tests-and-email.ps1`: Runs tests and emails on failure (local/Task Scheduler).
- `scripts/mail.env.example.ps1`: Example SMTP configuration for local email.
- `.github/workflows/playwright-cron-email.yml`: CI workflow that runs every 30 minutes and emails on failure.

## Quick Start (Local)
1) Install dependencies
   - `npm ci`
   - `npx playwright install --with-deps`

2) Configure email for local notifications
   - Copy `scripts/mail.env.example.ps1` to `scripts/mail.env.ps1` and fill values:
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`
   - Or set those as system/user environment variables instead of a file.

3) Run once to verify
   - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/run-tests-and-email.ps1"`
   - Behavior: if tests fail, an email is sent with the last 200 log lines and `playwright-report.zip` attached (if present). A copy of output is saved at `test-results/last-run.log`.

## Schedule Every 30 Minutes (Local)
Use Windows Task Scheduler to run continuously in the background.

- Create the scheduled task:
  - Command (adapt path if different):
    - `schtasks /Create /TN "Playwright Every 30min" /SC MINUTE /MO 30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\Users\yalci\OneDrive\Belgeler\Mortrack-Playwright\scripts\run-tests-and-email.ps1\"" /F`
- Tips:
  - If the project is under OneDrive, prefer “Run only when user is logged on”.
  - In Task Scheduler GUI, enable “Run task as soon as possible after a scheduled start is missed”.
  - Ensure PowerShell execution policy allows the script: we already use `-ExecutionPolicy Bypass`.

## Schedule Every 30 Minutes (GitHub Actions)
Runs independent of your PC. The workflow `.github/workflows/playwright-cron-email.yml` is already included and scheduled with `*/30 * * * *`.

Actions you must do:
- Add repository secrets (Settings → Secrets and variables → Actions → New repository secret):
  - `SMTP_SERVER`: e.g., `smtp.office365.com` or `smtp.gmail.com`
  - `SMTP_PORT`: e.g., `587`
  - `SMTP_USERNAME`: SMTP login
  - `SMTP_PASSWORD`: SMTP password (use an app password if provider requires 2FA)
  - `MAIL_FROM`: e.g., `Playwright Bot <bot@example.com>`
  - `MAIL_TO`: recipient list, e.g., `you@example.com`
- On failure, CI sends an email and also uploads the Playwright report artifact.

## Commands
- Run tests locally without email: `npx playwright test`
- Run with email-on-failure script: `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/run-tests-and-email.ps1"`

## Configuration Notes
- Email security: prefer app passwords (Gmail/Office365) instead of account passwords.
- Local script uses `Send-MailMessage` (commonly available on Windows PowerShell). If your environment blocks it, consider an SMTP CLI or Graph/REST notifier.
- `.gitignore` prevents committing secrets (`scripts/mail.env.ps1`) and generated logs/zips.

## Troubleshooting
- No email received:
  - Verify SMTP host/port, username/password, and that the sender is allowed.
  - Check spam/quarantine; try plain text body first.
  - Confirm `test-results/last-run.log` exists and review last lines.
- Script won’t run via scheduler:
  - Test the same command in an interactive PowerShell.
  - Ensure your account has access to the OneDrive path when the task runs.
  - In Task Scheduler, set “Run only when user is logged on” to simplify path/drive access.

