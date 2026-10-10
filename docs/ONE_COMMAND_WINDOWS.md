# Windows — Harbor one-command Cloudflare Pages deployment

**You do not need to install Node.js manually.** The simplest way is to **double-click `START-HARBOR-DEPLOYMENT.cmd`** in the extracted `Harbor` folder. Alternatively, open PowerShell in that directory and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\start-harbor-deployment.ps1
```

The script checks for Node.js 22.13+ and, if required, installs official Node.js LTS using `winget` (Windows may ask for approval). If Corepack is unavailable, it installs it only into a local ignored `.harbor-tools/` folder. It then runs the existing Harbor Pages deployment script and prompts you for Cloudflare browser authorization, D1 database ID, and optional private R2 storage. **Never send passwords, API tokens, or reviewer secrets in chat.**

If Windows says `winget` is unavailable, install official Node.js LTS from https://nodejs.org/en/download, close/reopen PowerShell, and rerun the same script.

If the Pages project `pathvirgil` already exists, rerun with:

```powershell
.\scripts\start-harbor-deployment.ps1 -ExistingProject
```

If your Cloudflare account has not activated R2 and you want a text-only reports demo, use `-WithoutPhotos`. This can disable photo uploads; do not claim them in the demo.

Deployment is **not complete** until the terminal prints the actual URL and successful smoke-test results. Your updated Android APK is a **separate build** that needs the resulting URL.
