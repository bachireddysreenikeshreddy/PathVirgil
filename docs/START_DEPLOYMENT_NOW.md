# Deploy Harbor to Cloudflare Pages — shortest path

Target: **https://pathvirgil.pages.dev** (only if `pathvirgil` is available).

## 1. Sign in to Cloudflare on your Windows computer

Sign in to your **own** account in the browser at https://dash.cloudflare.com .

Install Node.js 22.13+ if you do not already have it: https://nodejs.org/ . In PowerShell, verify `node --version`.

## 2. Run the included deployment script

Extract the entire ZIP. Open the extracted **Harbor** directory in File Explorer, right-click inside the folder and choose **Open in Terminal** (or use Windows PowerShell).

Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\deploy-pages.ps1
```

The script checks the project and offline resources, installs dependencies, tests the code, requests Cloudflare authentication through your browser, offers to create a D1 database and an R2 bucket, deploys the static PWA + Pages Functions, runs D1 migrations, and verifies live assets and `/api/health`.

**When prompted:** If you don't already have a production D1 database, answer `Y`, then copy the newly created D1 database **UUID** from the Wrangler output (not a credential). For an R2 bucket, answer `Y` if R2 has been activated. If Cloudflare requires billing activation for R2 and you want to skip it temporarily, re-run with `-WithoutPhotos` — photo submission will then be unavailable until R2 is enabled.

If Cloudflare says the Pages project `pathvirgil` already exists or is unavailable, use a different name, for example:

```powershell
.\scripts\deploy-pages.ps1 -Project pathvirgil-safety
```

Only use `-ExistingProject` when the Pages project truly already exists in your account. Do not create a second production D1 database when updating an existing site.

## 3. Confirm the live deployment

After the script succeeds, visit `https://pathvirgil.pages.dev/app/index.html` (or the new project address) and test the home screen. Then check `https://pathvirgil.pages.dev/api/health` returns JSON containing `"ok":true`. Use the Offline Kit and test re-opening in airplane mode after the assets finish saving.

Set the reviewer access token via the Cloudflare Wrangler prompt (do **not** share it or put it in a source file):

```powershell
corepack pnpm exec wrangler pages secret put MODERATOR_ACCESS_TOKEN --project-name pathvirgil
```

Keep this token in a password manager. The key should be a random string of at least 32 characters. If changing the project name, adjust `--project-name` accordingly.

## Next: Android APK

Once the new Pages website works, configure the GitHub Actions repository variable `HARBOR_APP_ORIGIN` to the **actual** `https://...pages.dev` origin and run the included `Build Harbor Android APK` workflow. A website release will not update the Android app's bundled offline content automatically. See `docs/GITHUB_APK_FINISH.md`.

## Notes

- This is a **direct-upload** Pages deployment using Wrangler (not dashboard drag-and-drop). Drag-and-drop does **not** compile the `functions` API folder.
- Do not publish secrets, account tokens, `.env` files or keystores to GitHub.
- Keep simulation data visibly identified as simulation and do not assert that a cached shelter is currently verified.
- If a command fails, stop and review the exact error. Do not treat the app as deployed until both the home page **and** `/api/health` work.
