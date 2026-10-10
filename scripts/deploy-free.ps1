# Harbor free Workers deployment for Windows PowerShell.
# Run from the extracted Harbor project. Requires Node.js, Python, Cloudflare account.
# Authentication is done by Cloudflare directly in your browser; never paste tokens into chat.
param(
  [string]$DatabaseId = '',
  [string]$WorkerName = 'harbor-travel-safety',
  [string]$DatabaseName = 'harbor-production',
  [string]$BucketName = 'harbor-photos-production',
  [switch]$ExistingBucket
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $projectRoot
function Confirm-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing $name. Install it, reopen PowerShell, and retry."
  }
}
function Assert-Exit([string]$label) {
  if ($LASTEXITCODE -ne 0) { throw "$label failed (exit code $LASTEXITCODE). Fix the error and retry." }
}
try {
  Write-Host 'Harbor — Free Cloudflare Workers deployment' -ForegroundColor Cyan
  Confirm-Command 'node'
  Confirm-Command 'corepack'
  & node --version
  Assert-Exit 'Node version'
  & corepack pnpm --version
  Assert-Exit 'pnpm setup (internet connection required)'

  Write-Host '[1/7] Install dependencies and check code' -ForegroundColor Cyan
  & corepack pnpm install --frozen-lockfile
  Assert-Exit 'Dependency installation'
  & corepack pnpm offline:build
  Assert-Exit 'Offline asset build'
  & corepack pnpm test
  Assert-Exit 'Tests'
  & corepack pnpm typecheck
  Assert-Exit 'Typecheck'

  Write-Host '[2/7] Cloudflare authentication' -ForegroundColor Cyan
  & corepack pnpm exec wrangler whoami
  if ($LASTEXITCODE -ne 0) {
    & corepack pnpm exec wrangler login
    Assert-Exit 'Cloudflare login'
  }
  Write-Host 'Verify that your Cloudflare Workers account has an active workers.dev subdomain.'
  Read-Host 'Press Enter after confirming this in your Cloudflare dashboard' | Out-Null

  Write-Host '[3/7] Cloudflare D1 database' -ForegroundColor Cyan
  if (-not $DatabaseId) {
    $choice = Read-Host 'Create a new D1 database? Enter Y for yes or N to reuse an existing database'
    if ($choice -match '^(y|yes)$') {
      $output = (& corepack pnpm exec wrangler d1 create $DatabaseName 2>&1 | Out-String)
      Write-Host $output
      Assert-Exit 'Create D1 database'
      $match = [regex]::Match($output, '(?i)[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
      if ($match.Success) { $DatabaseId = $match.Value }
    }
    if (-not $DatabaseId) {
      $DatabaseId = Read-Host 'Enter the D1 database UUID shown by Wrangler (not a secret)'
    }
  }
  if ($DatabaseId -notmatch '^[a-fA-F0-9]{8}-([a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}$') {
    throw 'Invalid D1 UUID. Copy the exact database_id from Cloudflare.'
  }

  Write-Host '[4/7] Private R2 photo bucket' -ForegroundColor Cyan
  if (-not $ExistingBucket) {
    $choice = Read-Host 'Create a new private R2 bucket? Y to create, N if it already exists'
    if ($choice -match '^(y|yes)$') {
      & corepack pnpm exec wrangler r2 bucket create $BucketName
      Assert-Exit 'Create R2 bucket (R2 activation may be required in Cloudflare)'
    }
  }

  Write-Host '[5/7] Build and configure the deployed Worker' -ForegroundColor Cyan
  & corepack pnpm build
  Assert-Exit 'Build'
  & node scripts/configure-free-deployment.mjs --database-id $DatabaseId --worker $WorkerName --database-name $DatabaseName --bucket $BucketName
  Assert-Exit 'Configure Worker'
  & corepack pnpm exec wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json
  Assert-Exit 'Database migration'

  Write-Host '[6/7] Deploy website and API' -ForegroundColor Cyan
  & corepack pnpm exec wrangler deploy --config dist/server/wrangler.json
  Assert-Exit 'Cloudflare deployment'
  Write-Host 'For first deployment, configure a strong moderation key (32+ random characters).'
  Write-Host 'Do NOT copy the key into chat, a file in the repository, or the frontend.'
  & corepack pnpm exec wrangler secret put MODERATOR_ACCESS_TOKEN --config dist/server/wrangler.json
  Assert-Exit 'Moderation secret'

  Write-Host '[7/7] Verify the deployed website' -ForegroundColor Cyan
  $origin = Read-Host 'Paste the actual https://...workers.dev URL printed by Cloudflare (public URL only)'
  & node scripts/check-production.mjs $origin
  Assert-Exit 'Production smoke test'
  Write-Host "Website and basic API checks passed: $origin" -ForegroundColor Green
  Write-Host 'NEXT: test real devices, open Offline Kit, and complete the GitHub APK workflow.'
  Write-Host 'See docs/GITHUB_APK_FINISH.md for the last steps.'
} finally {
  Pop-Location
}
