# Harbor — Deploy free to Cloudflare Workers (no purchased domain)

This deploys the Harbor **website and API together** to a Cloudflare `workers.dev` address. The public URL will be `<worker>.<your-cloudflare-account-subdomain>.workers.dev`, with HTTPS. **Do not guess this URL**; copy it from the successful `wrangler deploy` output.

This repository does not deploy by itself. You need a Cloudflare account, an authenticated terminal, and D1/R2 resources. Workers, D1 and R2 have usage-based plans and free allowances; check the current limits, R2 account activation requirements, and billing details in Cloudflare before enabling anything. Never treat this hackathon prototype as production emergency infrastructure.

## 1. Make an account and enable the workers.dev address

1. Sign up or sign in at https://dash.cloudflare.com/.
2. Open **Workers & Pages**, then set up the account's `workers.dev` subdomain when prompted. This does **not** require domain registration or DNS configuration.
3. If R2 requires additional account activation, finish that in the Cloudflare console. R2 can require billing setup even when your usage stays within its free allowance.

## 2. Install tools (from inside the extracted `Harbor` folder)

Install Node.js 22.13+ (Node 24 recommended), Corepack, and Python 3. From a terminal:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm offline:build
pnpm test
pnpm typecheck
```

If a check fails, resolve that error before deployment. The source archive does not include `node_modules`.

## 3. Create Cloudflare storage once

```bash
pnpm exec wrangler d1 create harbor-production
pnpm exec wrangler r2 bucket create harbor-photos-production
```

**Keep the real D1 UUID** printed by the D1 create command. Don't paste account tokens, reviewer secrets, or the UUID into public chat. If resources already exist, reuse their actual identifiers rather than attempting to create duplicates. Keep R2 private.

## 4. Build and configure the free domain

```bash
pnpm build
node scripts/configure-free-deployment.mjs --database-id YOUR_REAL_D1_UUID
```

Optional flags: `--worker harbor-travel-safety --database-name harbor-production --bucket harbor-photos-production`. The script updates **generated** `dist/server/wrangler.json` (which is Git-ignored) and copies SQL migrations. It enables `workers_dev=true` and removes any custom-domain routes; no domain purchase is required. If you rebuild later, rerun the configuration step before deploying.

## 5. Apply database migrations, deploy, and configure reviewer access

```bash
pnpm exec wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json
pnpm exec wrangler deploy --config dist/server/wrangler.json
pnpm exec wrangler secret put MODERATOR_ACCESS_TOKEN --config dist/server/wrangler.json
```

For a brand-new database, the migrations initialize the schema. For an existing database, review migrations carefully before applying; never reset real reports. Set a randomly generated secret of 32+ characters and enter it only when Wrangler prompts. After setting secrets, ensure the Worker is deployed and healthy.

**Example only**: `https://harbor-travel-safety.your-account-subdomain.workers.dev` — actual worker/account names may differ.

## 6. Verify the live site

```bash
node scripts/check-production.mjs https://YOUR_REAL_WORKER.YOUR_ACCOUNT_SUBDOMAIN.workers.dev
```

Open `/app/index.html`. Inspect `/api/health` and test real weather availability, report submission, photo upload, reviewer access, and official-alert source labels. Install the PWA using the browser menu. Open the offline kit, save essentials, confirm readiness, then turn on airplane mode and reopen the app. The PWA requires an initial online load. Cached data can be stale or evicted; never imply new live alerts are available offline.

The old web origin has separate browser storage. Offline reports stored at the old URL do **not** automatically transfer to the new one. Resolve/export pending reports before changing addresses.

## 7. Update the Android APK

The Android WebView embeds Harbor's offline resources, so an already-installed APK can open offline, but it must point to the **new** HTTPS server for weather, alerts, report syncing and photos.

**Fastest option (existing APK)**: open Harbor → Settings → Harbor server address and enter the actual `workers.dev` origin, then test. Note that any old app version may still contain an older default origin or branding in its binary; updating Settings does not rewrite that APK.

**Rebuild an updated APK** (source required): upload/push this source to your GitHub repository, then add repository variable `HARBOR_APP_ORIGIN` set to the deployed HTTPS origin (GitHub → Settings → Secrets and variables → Actions → Variables). Open Actions → **Build Harbor Android APK** → Run workflow. Download the `Harbor-Android` artifact. It is a development-signed sideload APK. **Do not upload any reviewer secret as this variable**; the origin is public.

Alternatively build locally with JDK 17+, Android SDK platform 35 and build-tools 35.0.0:

```bash
export HARBOR_ANDROID_BUILD_TOOLS="$ANDROID_HOME/build-tools/35.0.0"
export HARBOR_ANDROID_PLATFORM_JAR="$ANDROID_HOME/platforms/android-35/android.jar"
export HARBOR_ANDROID_SERVER_ORIGIN="https://YOUR_REAL_WORKER.YOUR_ACCOUNT_SUBDOMAIN.workers.dev"
python3 scripts/build-android.py
```

Windows PowerShell equivalent (after installing the Android SDK):

```powershell
$env:HARBOR_ANDROID_BUILD_TOOLS = "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0"
$env:HARBOR_ANDROID_PLATFORM_JAR = "$env:LOCALAPPDATA\Android\Sdk\platforms\android-35\android.jar"
$env:HARBOR_ANDROID_SERVER_ORIGIN = "https://YOUR_REAL_WORKER.YOUR_ACCOUNT_SUBDOMAIN.workers.dev"
py -3 scripts/build-android.py
```

A new development signing key may prevent this APK from updating an earlier installation. Back up/resolve queued reports before uninstalling an old APK. A successful Android build, signature verification, and real-device install must be confirmed before claiming the APK is ready.

## 8. Hackathon submission

Provide the real deployed URL (not a template), code repository, README, a testable APK if claiming Android support, and the required 2–5-minute demo video. Do not claim a test or deployment succeeded without checking it. Keep third-party licenses and API disclosures in `docs/DEPENDENCIES.md` and `vendor/`.
