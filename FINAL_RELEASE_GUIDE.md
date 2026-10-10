# PathVirgil — final source bundle

This is the **complete source**, not just a UI patch. Includes the website/PWA, bundled offline image/icon/map assets, Android APK build source, weather/AQI and GPS features, 15-language safety guides, D1 report-photo upload code, public Community Reports, moderator dashboard, and read-only judge dashboard.

## Important state

- Production site: https://pathvirgil.pages.dev (the old deployed version remains online until you redeploy this source).
- Deployment name: `pathvirgil` (do not create a second project).
- D1 database: `harbor-production` (legacy identifier intentionally preserved).
- Cloudflare R2: **not required**. Small compressed evidence photos are stored privately in D1 after applying `drizzle/0002_report_photos_d1.sql`.
- Judge and moderator roles require **two different 32+ character secrets** configured in Cloudflare Pages production settings. Secrets are not included in the ZIP.
- This package does **not** include a newly rebuilt or signed APK. Use `.github/workflows/build-android.yml`; first set the GitHub repository variable `HARBOR_APP_ORIGIN` to `https://pathvirgil.pages.dev`.

## Installing over your EXISTING Windows Harbor folder

1. Back up your existing working Harbor project folder, particularly `wrangler.jsonc`, any credentials, and any local reports awaiting sync. Do not email the backup or include secrets in a public repository.
2. Extract this ZIP. Open the `PathVirgil` folder **inside** the extracted ZIP and copy **its contents** into your existing Windows `Harbor` folder, replacing matching project files. Do not copy a nested `PathVirgil` folder into `Harbor`.
3. Keep your **existing** `Harbor/wrangler.jsonc` file (real D1 UUID, no R2 binding). The ZIP intentionally contains only `wrangler.pages.example.json` with fake IDs.
4. In PowerShell in the `Harbor` folder, run:

   ```powershell
   node scripts/generate-sw.mjs
   node scripts/preflight-pages.mjs
   .\node_modules\.bin\wrangler.cmd whoami
   ```

5. Back up live D1 if you have valuable reports. Create the private photo table **once** (safe to rerun thanks to `IF NOT EXISTS`):

   ```powershell
   .\node_modules\.bin\wrangler.cmd d1 execute harbor-production --remote --file .\drizzle\0002_report_photos_d1.sql
   ```

6. In Cloudflare dashboard → **Workers & Pages → pathvirgil → Settings → Variables and Secrets**, add unique, encrypted **Production** secrets: `MODERATOR_ACCESS_TOKEN` and `JUDGE_ACCESS_TOKEN`. Never put credentials in source, screenshots, chat or GitHub.
7. Deploy a **preview** (use a separate database when testing writes):

   ```powershell
   .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch final-preview
   ```

8. After visually reviewing the preview, deploy the existing live site:

   ```powershell
   .\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main
   ```

9. Open https://pathvirgil.pages.dev, hard-refresh if needed, and verify:
   - URL root and `/app/index.html` both load and show PathVirgil;
   - `/api/health` responds and weather/AQI works;
   - a **simulated/demo report** with a small photo uploads to the existing D1 DB;
   - team moderator can see private evidence and review a demo report;
   - a judge can view evidence, but cannot approve/reject or publish notices;
   - no signed-out user can see private report descriptions or photo evidence;
   - app's emergency guidance is accessible offline with the installed PWA.

## Files of interest

- `public/app/` — website, PWA, offline icons/maps, translations, forms and frontend photo compression.
- `public/index.html`, `public/sw.js` — root homepage and offline service worker.
- `functions/api/[[path]].ts`, `lib/api-handlers.ts` — Pages APIs and role enforcement.
- `drizzle/0002_report_photos_d1.sql` — private photo table for D1 (no R2 card needed).
- `docs/JUDGE_ACCESS_QUICKSTART.md` — separate judge/team credentials and permissions.
- `docs/D1_PHOTO_QUICKSTART.md` — evidence-upload setup and limits.
- `android/`, `.github/workflows/build-android.yml` — APK sources/build automation.
- `docs/PATHVIRGIL_TRANSLATION_REVIEW.md` — language review limitations.

## What is not finished just by downloading this ZIP

This is source code. The Cloudflare account remains yours, and deployment, D1 migration, secret creation and updated APK signing still need to be performed. D1 photos have code-level checks but production uploads must be verified after deployment. Some noncritical strings still fall back to English; safety translations need native review. PathVirgil is a hackathon prototype, not an official emergency dispatch or guaranteed safe-route service.
