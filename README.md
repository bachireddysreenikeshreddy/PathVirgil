# PathVirgil — Offline-first tourist safety

> Previously known as Harbor. The deployment databases and Android package ID retain legacy internal identifiers for compatibility. See `docs/PATHVIRGIL_TRANSLATION_REVIEW.md` for translation review status.

> **Updating the already-live Pages project:** Read **`FINAL_RELEASE_GUIDE.md`** before copying files into your existing Windows project folder. Preserve the real `wrangler.jsonc` file and D1 database bindings. The original first-time installer is also included for completeness.

> **Quick Pages deployment:** See [`docs/START_DEPLOYMENT_NOW.md`](docs/START_DEPLOYMENT_NOW.md) for the current Windows deployment steps.

# PathVirgil — Travel with clarity

A TravelTech hackathon pilot for **real-time crisis communication for tourists during extreme weather**. PathVirgil brings preparedness guidance, official alert feeds, local contacts, weather imagery and reviewed community reports into one interface.

**Web:** Deploy to Cloudflare Pages (see [Pages deployment and updates](docs/PAGES_DEPLOYMENT.md)); `pathvirgil.pages.dev` is the intended URL if available. No domain purchase required.  
**Android APK:** Build and distribute an APK after configuring a production server.  
**Pilot:** Mamallapuram / Chengalpattu, Tamil Nadu, India.  
**Languages:** 15 selectable languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, French, Spanish, German, Arabic, Japanese. Critical emergency guidance is localized for all 15; remaining UI strings may fall back to English. These are draft translations needing review.

## The problem and solution

Tourists face unfamiliar geography, fragmented alerts, language barriers and unreliable social media reports during floods or cyclones. PathVirgil keeps the essentials on the device, exposes source and expiry information, and requires review before community reports become public cautions.

- Responsive installable PWA for modern Android, iOS/iPadOS and desktop browsers.
- Reproducible Android 8+ APK build source with essential web app and map assets bundled into a locally compiled APK.
- Offline precautions, translated hazard labels, emergency numbers, bilingual help card, saved accommodation, local vector map, and the last downloaded alerts and places.
- Open-Meteo / MET Norway current model estimates and hourly forecast; interactive EUMETSAT infrared satellite overlay with timestamped playback.
- NDMA SACHET CAP alerts filtered to the pilot location, with expiry, cancellation/update handling, original bulletin and translated preparedness guidance.
- Photos and reports queued in IndexedDB before upload; stable receipt IDs make retries idempotent.
- Persistent Cloudflare D1 community reports and private evidence photos (compressed, stored in D1 on the free deployment without R2). R2 storage is optional for future scale.
- SHA-256 duplicate checks, EXIF time/location checks and metadata signals; optional experimental image classifier running on the device.
- Separate public Community Reports, protected team moderator controls, and **read-only judge access** using independent Cloudflare secrets. Private evidence is restricted to the original reporter and authorized reviewers; review decisions, evidence checks and audit history are recorded.
- Sourced shelter notices that expire in six hours; OSM hospitals and police locations have explicitly unknown availability.
- Local simulation exercises the reporting and moderation flow without publishing a fake incident.

## Try it

1. Open the web link and choose a language.
2. Open **Offline kit → Save essentials → Check offline readiness**.
3. Turn on airplane mode, close and reopen the installed app. Precautions, contacts, the saved map and queued reporting should remain available.
4. Reconnect to refresh source data and upload queued reports.
5. Use **Simulation** for the flood/bridge/shelter exercise. Reset it under Settings.
6. Team reviewer: enter the private reviewer access key in **Review** to review live submissions.

iPhone/iPad: Safari → Share → Add to Home Screen, then save essentials. Android/desktop: use the install control or browser install menu. An Android APK can be built and sideloaded after configuring the Android SDK; the source archive does not include a rebuilt APK.

The PWA needs a successful first download. Android bundles the core for first-launch offline use. Browser storage can be evicted or cleared; request persistent storage and recheck readiness. Telephone calls still require a cellular connection.

## Fast Windows deployment

For the new **free Cloudflare Pages** deployment, see [Windows Pages deployment guide](docs/PAGES_DEPLOYMENT.md). The earlier Worker-only route is retained as an alternative. This requires you to authenticate with Cloudflare; it cannot create an account for you. Afterward, use [GitHub APK finishing guide](docs/GITHUB_APK_FINISH.md) to publish and build the Android APK.

## Setup

Requirements: Node 24 recommended (tests use node:sqlite), pnpm 11.25.0, Python 3 for packaging; Android SDK 35 and JDK 17+ only for APK builds.

    corepack enable
    corepack prepare pnpm@11.25.0 --activate
    pnpm install --frozen-lockfile
    pnpm offline:build
    pnpm test
    pnpm typecheck
    pnpm build

Use the pinned package manager and lockfile. Optional postinstall scripts for onnxruntime-node and protobufjs are explicitly disabled; browser inference uses the bundled WASM runtime.

Server environment names are in .env.example. Configure MODERATOR_ACCESS_TOKEN as a high-entropy secret (at least 32 random characters). For Pages deployment, PUBLIC_APP_ORIGIN can be omitted because the website and API share an origin. These values are not in the frontend. Reviewer endpoints validate a server-only access key. Do not commit the key, share it with tourists, or put it in public files.

For local development outside the hosted workspace:

    pnpm dev

Use the generated local D1 bindings. Apply migrations with the supplied schema workflow; see docs/DEPLOYMENT.md. The app's API lives at /api/* and its installable client at /app/index.html. A static-only host cannot run the backend.

## Android build

    export HARBOR_ANDROID_BUILD_TOOLS=/path/to/android-sdk/build-tools/35.0.0
    export HARBOR_ANDROID_PLATFORM_JAR=/path/to/android-sdk/platforms/android-35/android.jar
    python scripts/build-android.py

Output after a successful local SDK build: public/downloads/PathVirgil-Android.apk. Source is in android/. The script creates an ignored development keystore; use a controlled release key for distribution. To preconfigure the APK, set `HARBOR_ANDROID_SERVER_ORIGIN=https://your-actual-pages-site.pages.dev` when building (or configure the HTTPS backend URL under Settings). The included GitHub Actions workflow builds a sideloadable development APK using the repository variable `HARBOR_APP_ORIGIN`. No previous hosting-provider address is embedded in the source. After your first free-hosting deployment, use the real URL Cloudflare displays.

iOS is delivered as a PWA. A native iOS binary/TestFlight release is not included and needs a Mac, Xcode and an Apple signing account.

## Architecture and validation

See docs/ARCHITECTURE.md, docs/TESTING.md and docs/EVALUATION.md. Run pnpm test for offline storage, UI logic, service-worker cache, CAP filtering and API security/workflow checks. Tests simulate transport/device APIs and use SQLite; they do not certify all browsers or devices.

See [Cloudflare Pages deployment and updates](docs/PAGES_DEPLOYMENT.md) for the Pages release process.

See docs/DEPENDENCIES.md and docs/dependencies.json for open-source/API disclosure, docs/PRIVACY.md for data handling, and docs/SUBMISSION.md for the remaining submission items. The demo video is intentionally deferred.

## Limits of the pilot

PathVirgil is a hackathon prototype, not a rescue dispatcher or a guarantee that a route or place is safe. Follow current local authorities. No live designated shelter is invented: absence of a confirmed listing directs users to disaster control. The current pack is local, not worldwide coverage.

The optional classifier can be wrong. Its output is a model score, not an authenticity probability; it cannot prove an event happened, where, or when. Missing metadata is not evidence of fakery. C2PA marker presence is detected but signatures are not validated. No reverse-image search or forensic certification is claimed. Independent human corroboration remains necessary.

Official bulletins retain their original text. Essential hazard labels and preparedness guidance are translated; arbitrary source text and community descriptions are not automatically translated. Translations require local expert review before operational deployment.

Automatic refresh/sync runs while the app is open or resumes. Background push notifications, guaranteed closed-app sync, emergency dispatch, verified routing and national shelter coverage are not implemented.


## October 10 feature update
See `docs/NEW_FEATURES_2026-10-10.md` and `docs/PATHVIRGIL_TRANSLATION_REVIEW.md` for GPS consent, 15-language safety guidance, air quality, satellite toggling, address verification limits, and the new Other incident category. Always redeploy after running `npm run offline:build`.


## Community verification / hackathon judge access

The Community Reports page separates **Unverified community submissions** from reviewed observations. Unreviewed descriptions, landmark details, and precise coordinates are not shown publicly. These are not official emergency alerts.

A protected Moderator Dashboard (`/#review`) supports two different access keys set as **Cloudflare Pages encrypted production secrets** (not in code):

- `MODERATOR_ACCESS_TOKEN`: team moderator, can view evidence and change review decisions/publish sourced shelters.
- `JUDGE_ACCESS_TOKEN`: separate **read-only** judge key, can examine the review queue and private evidence but cannot change any report or publish notices.

The app refuses authentication if these server secrets are identical. See `docs/JUDGE_ACCESS_QUICKSTART.md` for instructions and `UPDATE-PATHVIRGIL-COMMUNITY.cmd` for a preview deployment. Rotate the judge secret after the event.
