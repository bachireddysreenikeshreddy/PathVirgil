# Harbor — one-command setup and deployment on Windows 10/11.
# Installs Node LTS through Windows Package Manager only if needed, and installs
# Corepack locally to avoid administrator privileges for the package manager.
# All Cloudflare sign-ins remain interactive and are performed by the account owner.
param(
  [string]$Project = 'pathvirgil',
  [switch]$WithoutPhotos,
  [switch]$ExistingProject
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Refresh-Path {
  $userPath = [Environment]::GetEnvironmentVariable('Path','User')
  $machinePath = [Environment]::GetEnvironmentVariable('Path','Machine')
  $extra = @('C:\Program Files\nodejs', "$env:APPDATA\npm")
  $env:Path = ($extra + @($machinePath,$userPath) | Where-Object { $_ }) -join ';'
}
function Get-Valid-Node {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) { return $false }
  try {
    $versionText = (& node --version).Trim()
    $v = [version]($versionText -replace '^v','')
    return ($v -ge [version]'22.13.0')
  } catch { return $false }
}

Push-Location $root
try {
  Write-Host ''
  Write-Host '=== Harbor automated Windows setup ===' -ForegroundColor Cyan
  if (-not (Get-Valid-Node)) {
    Write-Host 'Node.js 22.13+ is missing or too old.' -ForegroundColor Yellow
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
      throw 'Windows Package Manager (winget) is missing. Install Node.js LTS from https://nodejs.org/en/download, reopen PowerShell, then rerun this script.'
    }
    Write-Host 'Installing the official Node.js LTS package using winget. Windows may ask for confirmation.'
    & winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
      throw "Node.js installation failed (winget code $LASTEXITCODE). Open https://nodejs.org/en/download to install Node.js LTS and rerun."
    }
    Refresh-Path
    if (-not (Get-Valid-Node)) {
      throw 'Node.js installed but is not available in this PowerShell process. Close and reopen PowerShell, then run this script again.'
    }
  }
  Write-Host "Node installed: $(& node --version)" -ForegroundColor Green

  if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    Write-Host 'Installing project-local Corepack (no administrator access needed)...'
    & npm install --prefix '.harbor-tools' --no-audit --no-fund --no-save corepack@0.34.5
    if ($LASTEXITCODE -ne 0) { throw 'Could not install Corepack. Verify network connectivity and retry.' }
    $env:Path = (Join-Path $root '.harbor-tools\node_modules\.bin') + ';' + $env:Path
    if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
      throw 'Local Corepack installation did not provide its command.'
    }
  }
  Write-Host 'Tooling is ready. Continuing with Pages deployment...' -ForegroundColor Green
  $argsToPass = @('-Project', $Project)
  if ($WithoutPhotos) { $argsToPass += '-WithoutPhotos' }
  if ($ExistingProject) { $argsToPass += '-ExistingProject' }
  & (Join-Path $PSScriptRoot 'deploy-pages.ps1') @argsToPass
  if (-not $?) { throw 'Harbor deployment did not complete. Share only the non-sensitive error message for troubleshooting.' }
} finally {
  Pop-Location
}
