# Harbor — Cloudflare Pages first deployment / subsequent release (Windows)
param(
 [string]$DatabaseId = '',
 [string]$Project = 'pathvirgil',
 [string]$Database = 'harbor-production',
 [string]$Bucket = 'harbor-photos-production',
 [switch]$WithoutPhotos,
 [switch]$Preview,
 [switch]$ExistingProject
)
$ErrorActionPreference='Stop'; Set-StrictMode -Version Latest
Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
function Assert-Exit([string]$what){if($LASTEXITCODE -ne 0){throw "$what failed ($LASTEXITCODE). Resolve the failure before continuing."}}
try {
 if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Install Node.js 22.13+ first.'}
 & node scripts/preflight-pages.mjs; Assert-Exit 'Harbor Pages preflight'
 if(-not (Get-Command corepack -ErrorAction SilentlyContinue)){throw 'Install Corepack/pnpm first.'}
 & corepack pnpm install --frozen-lockfile; Assert-Exit 'Install dependencies'
 & corepack pnpm offline:build; Assert-Exit 'Regenerate offline service worker'
 & corepack pnpm test; Assert-Exit 'Unit tests'
 & corepack pnpm typecheck; Assert-Exit 'TypeScript validation'
 & corepack pnpm exec wrangler whoami
 if($LASTEXITCODE -ne 0){ & corepack pnpm exec wrangler login; Assert-Exit 'Cloudflare authentication' }
 if(-not $DatabaseId){
  $choice=Read-Host 'Create a new D1 database? Y to create, N if already created'
  if($choice -match '^(y|yes)$'){& corepack pnpm exec wrangler d1 create $Database; Assert-Exit 'Create D1 database'}
  $DatabaseId=Read-Host 'Enter the REAL D1 database UUID from the command output or Cloudflare dashboard'
 }
 if((-not $WithoutPhotos) -and ((Read-Host 'Create a private R2 bucket? Y to create, N if it already exists') -match '^(y|yes)$')){
  & corepack pnpm exec wrangler r2 bucket create $Bucket; Assert-Exit 'Create R2 bucket'
 }
 $configArgs=@('scripts/configure-pages.mjs','--database-id',$DatabaseId,'--name',$Project,'--database-name',$Database,'--bucket',$Bucket)
 if($WithoutPhotos){$configArgs+=@('--without-photos','true')}
 & node @configArgs; Assert-Exit 'Configure Pages'
 if(-not $ExistingProject){
   Write-Host 'Creating Pages Direct Upload project. Choose a different project name if unavailable.'
   & corepack pnpm exec wrangler pages project create $Project --production-branch main; Assert-Exit 'Create Pages project'
 }
 if(-not $Preview){
  & corepack pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.pages.json; Assert-Exit 'D1 migrations'
 } else { Write-Host 'Preview: skipping DB migrations. Use separate preview D1/R2 bindings before testing writes.' }
 $branch='main'; if($Preview){$branch='preview'}
 & corepack pnpm exec wrangler pages deploy public --project-name $Project --branch $branch; Assert-Exit 'Pages deployment'
 if(-not $Preview){
  Write-Host 'Configure a long random reviewer secret separately when ready (DO NOT paste it in chat):'
  Write-Host "  corepack pnpm exec wrangler pages secret put MODERATOR_ACCESS_TOKEN --project-name $Project"
  $url='https://'+$Project+'.pages.dev'
  & node scripts/check-production.mjs $url; Assert-Exit 'Live website / API smoke check'
  Write-Host "Public website: $url"
 } else { Write-Host 'Preview deployed. Copy the preview URL from Wrangler output and test before production.' }
} finally {Pop-Location}
