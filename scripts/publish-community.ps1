# Update existing PathVirgil Cloudflare Pages deployment without new accounts or database.
param([switch]$Production)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
function Assert-Exit([string]$action) { if ($LASTEXITCODE -ne 0) { throw "$action failed (exit $LASTEXITCODE)." } }
try {
 if (!(Test-Path '.\wrangler.jsonc')) { throw 'Missing existing wrangler.jsonc. Apply the update to your deployed Harbor folder, NOT a new folder.' }
 if (!(Test-Path '.\node_modules\.bin\wrangler.cmd')) { throw 'Wrangler not installed. Run this from the existing deployed project folder.' }
 Write-Host 'PathVirgil: Community Reports + Protected Moderator Dashboard + Read-Only Judge Access' -ForegroundColor Cyan
 & node scripts/generate-sw.mjs; Assert-Exit 'Offline asset generation'
 & node scripts/preflight-pages.mjs; Assert-Exit 'Cloudflare Pages preflight'
 & node --test tests/judge-access.test.mjs tests/d1-photo-storage.test.mjs; Assert-Exit 'Community regression checks'
 & .\node_modules\.bin\wrangler.cmd whoami; Assert-Exit 'Cloudflare sign-in check'
 if ($Production) {
  Write-Host 'This updates the LIVE https://pathvirgil.pages.dev website and its live moderation API.' -ForegroundColor Yellow
  Write-Host 'Before continuing, add separate MODERATOR_ACCESS_TOKEN and JUDGE_ACCESS_TOKEN secrets under Cloudflare Pages Production settings.' -ForegroundColor Yellow
  $yes=Read-Host 'Type PUBLISH to deploy to production'
  if ($yes -cne 'PUBLISH') { Write-Host 'Cancelled without publishing.';return }
  & .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main
 }else{
  Write-Host 'Publishing a preview only; the public site is unchanged.' -ForegroundColor Cyan
  & .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch moderation-preview
 }
 Assert-Exit 'Cloudflare Pages deploy'
 Write-Host 'Completed. Preview or production link appears above.' -ForegroundColor Green
 Write-Host 'For judge key instructions see docs/JUDGE_ACCESS_QUICKSTART.md'
}finally{Pop-Location}
