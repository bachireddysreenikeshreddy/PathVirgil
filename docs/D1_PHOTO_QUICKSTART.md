# Fastest option (Windows)

Extract the **update ZIP** into the **existing `Harbor` folder** on your PC, choosing replace/overwrite existing files when asked. Preserve `wrangler.jsonc` and your current D1 configuration.

Double-click **`ENABLE-COMMUNITY-PHOTOS.cmd`**. After local checks, type `YES` when prompted. This adds one table to your existing D1 database and redeploys your existing `pathvirgil` site. No R2 account activation or credit card is needed.

If the page still shows old content, hard refresh (Ctrl+Shift+R) or use a new private window. Mobile offline caches may need to be refreshed. The photo is uploaded only after connection is restored; it is stored privately as evidence.

---

# Enable community photo evidence without Cloudflare R2 or a card

This build stores *compressed* evidence photos in **the existing D1 database**. No R2 bucket, payment activation or new Pages project is needed.

**Before using this update:** make sure `wrangler.jsonc` in the *existing deployed Harbor folder* still points to your existing `harbor-production` D1 database. Back up the D1 database if it contains reports you need to preserve. DO NOT replace that file from a new ZIP.

1. Copy the updated `lib/api-handlers.ts`, `functions/api/[[path]].ts`, `public/` and new `drizzle/0002_report_photos_d1.sql` into the working Harbor project (or use this full ZIP with your old working `wrangler.jsonc`). Do **not** overwrite database configuration or create a new D1 database.
2. Open PowerShell in Harbor. Confirm `wrangler whoami` succeeds.
3. Run the SQL migration **once** on the EXISTING D1 database:

```powershell
.\node_modules\.bin\wrangler.cmd d1 execute harbor-production --remote --file .\drizzle\0002_report_photos_d1.sql
```

4. Run checks, then deploy:

```powershell
node scripts/generate-sw.mjs
node scripts/preflight-pages.mjs
.\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main
```

5. Test a photo submission at https://pathvirgil.pages.dev and confirm it is queued or acknowledged. A moderator must review the report; private photo evidence is *not* published to everyone.

### Limits and privacy

- The browser downsizes a photograph to **230 KB or less**; older offline queued photos are downsized before they sync. Photos are private to the reporter's receipt and authorized reviewers.
- The server only accepts <=300 KB photos when R2 is absent. It validates photo signatures and retains duplicate-image detection and review requirements.
- D1 Free tier is capped at 500 MB/database and 2 MB/row; this prototype needs retention/usage monitoring and is not intended as an unlimited image storage service.
- A submission should not be interpreted as an official verified hazard. Photos do not establish truth.
- Existing app installations will need a service-worker refresh; Android APK needs a rebuild to get the new client compression.
- This does not make images publicly visible in the community feed. That requires a separately moderated public-image feature.
