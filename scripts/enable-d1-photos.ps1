# PathVirgil: enable small private community evidence photos using existing Cloudflare D1.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
function Check-Exit([string]$task) { if ($LASTEXITCODE -ne 0) { throw "$task failed ($LASTEXITCODE)." } }
try {
 if (!(Test-Path '.\wrangler.jsonc')) { throw 'Missing your existing Cloudflare wrangler.jsonc. Put this patch into the EXISTING deployed Harbor folder; do not overwrite your Cloudflare configuration.' }
 if (!(Test-Path '.\node_modules\.bin\wrangler.cmd')) { throw 'Missing the existing Wrangler installation. Use the working Harbor project folder.' }
 if (!(Test-Path '.\drizzle\0002_report_photos_d1.sql')) { throw 'Missing the new D1 migration file.' }
 Write-Host '=== PathVirgil private community photo upload (D1, no R2) ===' -ForegroundColor Cyan
 Write-Host 'Uses existing Cloudflare Pages project pathvirgil and existing D1 database harbor-production.'
 Write-Host 'Does NOT create a new Cloudflare project or enable R2.'
 & node --test tests/d1-photo-storage.test.mjs; Check-Exit 'D1 photo smoke tests'
 & node scripts/generate-sw.mjs; Check-Exit 'Offline manifest'
 & node scripts/preflight-pages.mjs; Check-Exit 'Pages preflight'
 & .\node_modules\.bin\wrangler.cmd whoami; Check-Exit 'Cloudflare authentication'
 $confirm=Read-Host 'Type YES to create private photo table in EXISTING harbor-production D1 and update LIVE pathvirgil.pages.dev'
 if ($confirm -cne 'YES') { Write-Host 'Cancelled. No remote changes made.'; return }
 & .\node_modules\.bin\wrangler.cmd d1 execute harbor-production --remote --file .\drizzle\0002_report_photos_d1.sql; Check-Exit 'Photo D1 table migration'
 & .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main; Check-Exit 'Pages production deployment'
 Write-Host 'Deployment complete. Test https://pathvirgil.pages.dev/#report with a small photo.' -ForegroundColor Green
 Write-Host 'Note: photo evidence is private until an authorized reviewer checks the report.'
} finally { Pop-Location }
