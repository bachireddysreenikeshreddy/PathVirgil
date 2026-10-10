# Harbor: own-domain deployment + Android APK

This is a **guide and deployment tooling**, not an assertion the website has been deployed or an APK rebuilt. Harbor is a full-stack Cloudflare Worker with D1 database, private R2 photos and a static PWA. Static-only hosting cannot run its API.

## 0. Prerequisites

- Domain you control (e.g. `harbor.your-domain.com`, not a placeholder), active in a Cloudflare DNS zone.
- Your own Cloudflare account with Workers, D1 and R2 enabled. Confirm quotas and pricing before you proceed.
- Node.js 22.13+ (Node 24 recommended), Corepack, Python 3. For mobile build: Android SDK platform 35, build-tools 35.0.0 and JDK 17+. Windows users should use PowerShell and run Python as `py -3` if `python` is not found.
- Download and extract the Harbor source ZIP. Run the commands below inside the **Harbor** directory that contains `package.json`.

## 1. Attach the domain to Cloudflare

Purchase or use a domain you already own, then add that domain in Cloudflare > Websites. If the domain is at another registrar, update its authoritative nameservers to the exact Cloudflare nameservers shown for your zone. Wait for the zone to show **Active**. You can keep registrar ownership where it is. If the desired hostname already has a CNAME DNS record, resolve that conflict before attaching it as a Worker Custom Domain. Cloudflare manages TLS for an active custom domain.

## 2. Install and log in

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm offline:build
pnpm test
pnpm typecheck
```

## 3. Create production storage

```sh
pnpm exec wrangler d1 create harbor-production
pnpm exec wrangler r2 bucket create harbor-photos-production
```

**Copy the real D1 database UUID** printed by the first command. Never invent a UUID or use the zero-valued placeholder in `vite.config.ts` for production. The R2 bucket remains private; Harbor's backend mediates photo access.

## 4. Build and configure the custom domain

```sh
pnpm build
node scripts/configure-deployment.mjs --domain harbor.your-domain.com --database-id YOUR-D1-UUID --database-name harbor-production --bucket harbor-photos-production
```

Use the *real* hostname that belongs to you, not `harbor.your-domain.com`. The script updates the generated `dist/server/wrangler.json` for production (name, custom-domain route, D1/R2 bindings, canonical origin) and copies both checked-in SQL migrations next to it. It deliberately does not save secret values. `dist` is ignored by Git.

## 5. Apply schema and deploy

```sh
pnpm exec wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json
pnpm exec wrangler deploy --config dist/server/wrangler.json
```

For a new database this applies the schema. For an existing DB, review migrations carefully before applying; do not reset or overwrite existing user reports. The first deployment may require you to approve the new custom-domain attachment. Cloudflare will provision the DNS/TLS for an eligible hostname on an active zone; don't also create a conflicting CNAME record.

## 6. Set the reviewer credential — server only

Generate a random key with 32+ random characters (for example, use an offline password manager or `python -c "import secrets;print(secrets.token_urlsafe(48))"`) and keep it secret. Do **not** add it to the repository or the browser's public JavaScript.

```sh
pnpm exec wrangler secret put MODERATOR_ACCESS_TOKEN --config dist/server/wrangler.json
```

Enter the credential only into the terminal prompt. This secret is used in the Review screen for authorized team moderation. Keep the Worker configuration's `PUBLIC_APP_ORIGIN` equal to the actual deployed HTTPS origin to preserve Android WebView CORS restrictions.

## 7. Check the deployed website

```sh
node scripts/check-production.mjs https://harbor.your-domain.com
```

Then manually confirm: homepage redirects to `/app/index.html`; install the PWA; save Offline Kit; enable airplane mode and relaunch; verify real weather displays its sources and simulated data remains clearly labeled; submit a demonstration report and validate moderation access. `check-production.mjs` is a **smoke test**, not proof of real-device or emergency accuracy.

If DNS/certificate activation is slow and your hackathon deadline is near, preserve a working fallback deployment under a temporary provider URL; do not assert the custom domain works until verified. Use whichever **actual, functional** deployment URL you submit.

## 8. Produce the Android APK (recommended: GitHub Actions)

1. Push the Harbor directory to a repository you control. The ZIP includes `.github/workflows/build-android.yml`.
2. In GitHub repository **Settings > Secrets and variables > Actions > Variables**, add `HARBOR_APP_ORIGIN` with your actual origin, e.g. `https://harbor.your-domain.com`. This is public configuration, **not** the reviewer secret.
3. Open **Actions > Build Harbor Android APK > Run workflow**.
4. Once complete, download the `Harbor-Android` artifact and extract the APK from the artifact ZIP.
5. Install on a test Android phone. In **Settings** the server address can be changed manually if needed. Test in airplane mode and online with the custom domain.

The GitHub Action uses a **new development signing key for each fresh build runner**. An APK signed this way generally **cannot install as an update** over an existing Harbor package signed with a different key. Export/resolve any queued offline reports before uninstalling the old app. Uninstalling can delete app-local data. For future updates use a securely retained release signing key; never commit its keystore or password to GitHub. The Android build must finish successfully before an APK can be claimed as complete.

## 9. Alternative: build Android APK locally

Install JDK 17+, Android Studio / command-line tools, `platforms;android-35`, `build-tools;35.0.0`, and Python 3. In a Bash shell:

```sh
export HARBOR_ANDROID_BUILD_TOOLS="$ANDROID_HOME/build-tools/35.0.0"
export HARBOR_ANDROID_PLATFORM_JAR="$ANDROID_HOME/platforms/android-35/android.jar"
export HARBOR_ANDROID_SERVER_ORIGIN="https://harbor.your-domain.com"
python scripts/build-android.py
```

In Windows PowerShell:

```powershell
$env:HARBOR_ANDROID_BUILD_TOOLS = "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0"
$env:HARBOR_ANDROID_PLATFORM_JAR = "$env:LOCALAPPDATA\Android\Sdk\platforms\android-35\android.jar"
$env:HARBOR_ANDROID_SERVER_ORIGIN = "https://harbor.your-domain.com"
py -3 scripts/build-android.py
```

Local APK output: `public/downloads/Harbor-Android.apk`. `HARBOR_ANDROID_SERVER_ORIGIN` is baked **only into the packaged APK's config.js**; it does not change the public PWA's origin. If unset, Android works offline but needs the server entered under Settings to use APIs.

## 10. Hackathon submission

Submit a GitHub repository with your working code and clear README, real deployed web link, testable APK, open-source/API disclosures, and the required 2–5-minute demo video. The team leader submits before the event deadline. Do not publish secrets, pretend simulated alerts are official, or represent a successful build before it actually runs.

## Important limitations

Changing the domain creates a **new web origin**, so old browser IndexedDB/cache data **does not automatically migrate**. Ask users to export or resolve queued reports before switching domains. The Android app stores data under its stable local asset origin, but uninstalling it can erase offline data. Live forecasts, new bulletins, and report uploads require internet; bundled help remains available offline.
