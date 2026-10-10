# Deploy PathVirgil UI/translation changes to a preview of the existing Pages project.
# Run from the EXISTING Harbor folder after extracting the update bundle over it.
$ErrorActionPreference='Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path .\wrangler.jsonc)) { throw 'Missing existing wrangler.jsonc. Use the already working Harbor project folder. This protects your D1 database setup.' }
if (-not (Test-Path .\node_modules\.bin\wrangler.cmd)) { throw 'Missing Wrangler; use the Harbor folder that previously deployed successfully.' }
& node --test tests/pathvirgil-i18n.test.mjs
if ($LASTEXITCODE -ne 0) {throw 'Language tests failed. Deployment stopped.'}
& node scripts/generate-sw.mjs
if ($LASTEXITCODE -ne 0) {throw 'Offline manifest generation failed. Deployment stopped.'}
& .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch pathvirgil-preview
if ($LASTEXITCODE -ne 0) {throw 'Preview deployment failed.'}
Write-Host 'Preview ready. Open the unique preview URL above, test it, then deploy to main only after verification.'
