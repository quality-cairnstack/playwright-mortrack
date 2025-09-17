Param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

# Load optional local SMTP config (not committed). See scripts/mail.env.example.ps1
$envFile = Join-Path $PSScriptRoot 'mail.env.ps1'
if (Test-Path $envFile) {
  . $envFile
}

function Require-Env([string]$name) {
  if ([string]::IsNullOrWhiteSpace($env:$name)) {
    throw "Missing required environment variable: $name"
  }
}

try {
  Require-Env 'SMTP_HOST'
  Require-Env 'SMTP_PORT'
  Require-Env 'SMTP_USER'
  Require-Env 'SMTP_PASS'
  Require-Env 'MAIL_FROM'
  Require-Env 'MAIL_TO'
} catch {
  Write-Warning $_
  Write-Host 'Set variables via system env, Task Scheduler, or scripts/mail.env.ps1'
}

Set-Location $RepoPath

# Run tests and capture output
Write-Host "Running Playwright tests in $RepoPath..."
$start = Get-Date
$output = & npx playwright test 2>&1
$exitCode = $LASTEXITCODE
$end = Get-Date

# Persist last run output
$logDir = Join-Path $RepoPath 'test-results'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logPath = Join-Path $logDir 'last-run.log'
$output | Out-File -FilePath $logPath -Encoding UTF8

if ($exitCode -ne 0) {
  Write-Warning "Tests failed with exit code $exitCode. Sending email notification..."

  # Attempt to include a compressed HTML report if present
  $reportPath = Join-Path $RepoPath 'playwright-report'
  $attachment = $null
  if (Test-Path $reportPath) {
    try {
      $archivePath = Join-Path $logDir 'playwright-report.tgz'
      if (Test-Path $archivePath) { Remove-Item $archivePath -Force }
      # Create a tar.gz archive using built-in Compress-Archive alternative
      # Compress-Archive makes .zip; more compatible for email clients
      $zipPath = Join-Path $logDir 'playwright-report.zip'
      if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
      Compress-Archive -Path (Join-Path $reportPath '*') -DestinationPath $zipPath -Force
      $attachment = $zipPath
    } catch {
      Write-Warning "Could not compress report: $_"
    }
  }

  try {
    $securePass = ConvertTo-SecureString $env:SMTP_PASS -AsPlainText -Force
    $cred = [System.Management.Automation.PSCredential]::new($env:SMTP_USER, $securePass)

    $subject = "Playwright FAILED on $(hostname) at $(Get-Date -Format s)"
    $bodyHeader = @(
      "Repository: $RepoPath",
      "Host: $(hostname)",
      "Start: $start",
      "End: $end",
      "Exit code: $exitCode",
      "--- Output (last 200 lines) ---"
    ) -join "`n"
    $bodyOutput = ($output | Select-Object -Last 200) -join "`n"
    $body = "$bodyHeader`n$bodyOutput"

    $mailParams = @{
      SmtpServer = $env:SMTP_HOST
      Port       = [int]$env:SMTP_PORT
      UseSsl     = $true
      Credential = $cred
      From       = $env:MAIL_FROM
      To         = $env:MAIL_TO
      Subject    = $subject
      Body       = $body
      Encoding   = [System.Text.Encoding]::UTF8
    }
    if ($attachment) { $mailParams.Attachments = $attachment }

    # Send-MailMessage is deprecated but widely supported for SMTP AUTH scenarios
    Send-MailMessage @mailParams
    Write-Host "Failure email sent to $($env:MAIL_TO)"
  } catch {
    Write-Error "Failed to send email: $_"
  }
} else {
  Write-Host "Tests passed. No email sent."
}

exit $exitCode

