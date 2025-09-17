## Copy this file to scripts/mail.env.ps1 and fill in real values.
## Do NOT commit scripts/mail.env.ps1 (it is gitignored).

$env:SMTP_HOST = 'smtp.office365.com'   # or 'smtp.gmail.com'
$env:SMTP_PORT = '587'                  # 587 for STARTTLS
$env:SMTP_USER = 'user@example.com'     # SMTP auth username
$env:SMTP_PASS = 'app-password-or-token'# SMTP auth password (use app password)
$env:MAIL_FROM = 'Playwright Bot <user@example.com>'
$env:MAIL_TO   = 'you@example.com; teammate@example.com'

