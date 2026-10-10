# Publish PathVirgil to your existing Cloudflare Pages site

This release changes visible branding and offline safety-language content. It does **not** require creating another Pages project, D1 database, R2 bucket, or running database migrations.

## On Windows, preview without replacing production

1. Extract `PathVirgil-multilingual-branded-source.zip` to a new folder (do not overwrite your working Harbor folder).
2. Copy the *existing* `wrangler.jsonc` from the current successful Harbor project folder into the root of the extracted `Harbor` folder. This preserves your real D1 UUID and disabled-photo configuration. Do not send the config if it includes private values, and never share secrets.
3. Open PowerShell in the extracted `Harbor` folder and run:

```powershell
node scripts/generate-sw.mjs
node --test tests/pathvirgil-i18n.test.mjs
node scripts/preflight-pages.mjs
.\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch pathvirgil-preview
```

If the new folder does not have `node_modules`, copy it from the previously working local project (same pinned dependencies) or install dependencies with the project's package manager before running Wrangler. Alternatively, run Wrangler from your existing project's `node_modules` using its absolute path.

4. Open the **preview URL printed by Wrangler**. Verify all 15 languages, emergency guidance, wordmark, map and location permissions, air quality, reporting, and airplane-mode behavior. The safety translations are drafts awaiting fluent-speaker and safety-expert review.

## Publish when the preview is satisfactory

In the same updated folder:

```powershell
.\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main
```

Cloudflare will retain the same `https://pathvirgil.pages.dev` project. Do not delete or recreate D1. Current community reports are stored in the existing D1 database and should remain intact.

## Android

The source includes an updated Android app label **PathVirgil** and GitHub Actions APK build workflow. It does **not** include a newly signed APK. Rebuild and test the Android app separately, configuring its backend origin as `https://pathvirgil.pages.dev`. The native Android package identifier remains unchanged to avoid unnecessary installed-app/data migration. The Android workflow produces a `PathVirgil-Android.apk` build artifact.

## Known limitations

- Some noncritical interface labels remain in English in the 11 added languages; this is explicitly disclosed in the app.
- All safety-critical translation drafts need review by fluent speakers and relevant local emergency authorities before real-world dependence.
- The production backend and its security policy remain unchanged; photo uploads still require an R2 bucket.
- This package's offline web assets are regenerated; browsers may need a reload to install the newer service-worker cache.
