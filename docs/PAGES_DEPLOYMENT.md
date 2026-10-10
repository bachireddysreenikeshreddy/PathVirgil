# Harbor — Cloudflare Pages deployment & safe updates

**Target:** `https://pathvirgil.pages.dev` if that Pages project name is available. This is a Cloudflare-owned subdomain; no purchased domain and no custom account subdomain are needed.

The **static offline PWA** resides in `public/app`, with a `/` redirect to `/app/index.html`. **Same-origin Pages Functions** handle `/api/*` using the same backend logic as the Worker build. D1 stores alerts/reports/cache; private R2 stores uploaded report photos (requires R2 activation); moderator keys are server-side secrets. The Android APK is unchanged until rebuilt.

## Initial setup (Windows)

1. Have a Cloudflare account, Node.js 22.13+ and Corepack/pnpm, and an internet connection. Authenticate via `pnpm exec wrangler login` in your own browser. Do not send API keys or access tokens over chat.
2. Extract this ZIP, and in PowerShell inside the `Harbor` directory run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\deploy-pages.ps1
```

The script prompts to create/reuse your D1 database and R2 bucket, then configures and deploys Pages and runs read-only `/api/health` and asset checks. If your Pages project name is taken, run with `-Project your-unique-name`. Activate R2 through the dashboard if needed; if unavailable, choose `-WithoutPhotos` to deploy without photo evidence (photo uploads will not work; disclose this limitation). **Do not reset an existing database.**

Important: the script creates a **Direct Upload** Pages project. Cloudflare does not let you later convert a Direct Upload project to built-in Git integration without making a new Pages project. You can still automate Wrangler deployments from GitHub Actions. If you prefer built-in GitHub branch previews, connect a newly created Git repository to Pages *before* your initial deploy, and use the same `public` output directory; verify Pages Functions and D1/R2 bindings in project settings first.

## Updates and previews

To test a modification without changing the public site, run:

```powershell
.\scripts\deploy-pages.ps1 -ExistingProject -Preview -DatabaseId YOUR_EXISTING_D1_UUID
```

To deploy a tested version to production:

```powershell
.\scripts\deploy-pages.ps1 -ExistingProject -DatabaseId YOUR_EXISTING_D1_UUID
```

**Data safety:** The example preview shares D1/R2 bindings with production! To test user report creation, moderation, or schema changes, set up separate preview D1/R2 resources and configuration. Do not post test emergency alerts on the production feed. Use local simulation for UI demos.

For each release, execute `pnpm offline:build`, `pnpm test`, `pnpm typecheck`; test the PWA in airplane mode, including after reload and cache upgrade. Pages previews have separate origins and therefore separate browser storage and offline caches.

## Reviewer access

Set a strong random token (at least 32 characters):

```powershell
corepack pnpm exec wrangler pages secret put MODERATOR_ACCESS_TOKEN --project-name pathvirgil
```

Type it only into Wrangler's secure prompt. Do not put it in GitHub source, `public/`, or chat.

## Updated Android APK

After the Pages URL is really live, set GitHub Actions repository variable `HARBOR_APP_ORIGIN` to the **real deployed origin**, e.g. `https://pathvirgil.pages.dev`, and run `Build PathVirgil Android APK`. Test the resulting sideload APK on a physical device in airplane mode. A different signing key can prevent direct upgrades from an old APK. Pending offline reports in the old app should be resolved before reinstalling.

## Production verification

```powershell
node scripts/check-production.mjs https://pathvirgil.pages.dev
```

Then manually test real weather, official alerts, offline kit, queue sync, photo upload (if R2 enabled) and reviewer workflow. Website deployment does **not** automatically update an installed Android APK.

## Limits

Pages Functions requests count against Workers plan quotas, and Cloudflare D1/R2 usage quotas apply. Pages static asset delivery is separate. The prototype is not an operational emergency warning system.
