# PathVirgil — Travel with clarity

**Offline-first multilingual tourist safety Progressive Web App (PWA)**

**Live website:** https://pathvirgil.pages.dev/

PathVirgil is submitted as a **hosted web application and installable PWA**. **No Android APK is required or included in this release.** Some internal identifiers retain the former Harbor name to preserve existing database compatibility.

A TravelTech hackathon pilot for **real-time crisis communication for tourists during extreme weather**. PathVirgil brings preparedness guidance, official alert feeds, local contacts, weather imagery and reviewed community reports into one interface.

**Live web/PWA:** [https://pathvirgil.pages.dev/](https://pathvirgil.pages.dev/) — hosted on Cloudflare Pages. No custom domain or Android APK required.  
**Languages:** 15 selectable languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, French, Spanish, German, Arabic, Japanese. Critical emergency guidance is localized for all 15; remaining UI strings may fall back to English. These are draft translations needing review.

## The problem and solution

Tourists face unfamiliar geography, fragmented alerts, language barriers and unreliable social media reports during floods or cyclones. PathVirgil keeps the essentials on the device, exposes source and expiry information, and requires review before community reports become public cautions.

- Responsive installable PWA for modern Android, iOS/iPadOS and desktop browsers.
- Installable web experience: after first online setup, the service worker caches the essential application shell and safety pack so the PWA can reopen offline. (An optional Android wrapper exists in source, but an APK is **not** a submission deliverable.)
- Offline precautions, translated hazard labels, emergency numbers, bilingual help card, saved accommodation, local vector map, and the last downloaded alerts and places.
- Open-Meteo / MET Norway current model estimates and hourly forecast; interactive EUMETSAT infrared satellite overlay with timestamped playback.
- NDMA SACHET CAP alerts filtered to the pilot location, with expiry, cancellation/update handling, original bulletin and translated preparedness guidance.
- Photos and reports queued in IndexedDB before upload; stable receipt IDs make retries idempotent.
- Persistent Cloudflare D1 community reports and private evidence photos (compressed, stored in D1 on the free deployment without R2). R2 storage is optional for future scale.
- SHA-256 duplicate checks, EXIF time/location checks and metadata signals; optional experimental image classifier running on the device.
- Separate public Community Reports and protected moderator controls. A separate read-only judge role exists in code **only if** a distinct `JUDGE_ACCESS_TOKEN` is configured; it was not configured in the last confirmed production setup. Private evidence is restricted to the reporter and authorized reviewers.
- Sourced shelter notices that expire in six hours; OSM hospitals and police locations have explicitly unknown availability.
- Local simulation exercises the reporting and moderation flow without publishing a fake incident.

## Install and test offline — no APK needed

1. With internet, open **https://pathvirgil.pages.dev/** and select a language.
2. **Install the PWA** where your browser/device permits it:
   - **Android:** Chrome menu → **Install app** or **Add to Home screen**.
   - **iPhone/iPad:** Safari → **Share** → **Add to Home Screen**.
   - **Desktop:** Use your browser's install-app control where available; otherwise you can still open the website.
3. In PathVirgil, choose **Offline Kit → Save essentials → Check offline readiness**. Wait for a successful readiness result before relying on offline access.
4. Turn on airplane mode, close the PWA, and reopen the **installed** PWA. Check the cached safety guidance, translated precautions, emergency contacts, and any downloaded map/places information.
5. Optionally prepare a **clearly labeled demonstration** incident offline. It should stay in the device's pending queue and upload only after reconnecting.
6. Reconnect to refresh weather, air quality, official alerts and community information.

### What offline mode can and cannot do

**Available after successful preparation and while saved data remains:** the PWA interface, bundled emergency steps and translations, stored emergency contacts, cached map resources and previous downloaded information, and locally queued incident reports/photos.

**Requires an internet connection:** new live weather/AQI, updated official alerts, fresh map/geocoding queries, sharing reports with other users, server-based moderation, and photo upload to D1. Previously fetched information may be outdated: the interface must clearly show its source and last-update time.

**Not supported:** first-time offline installation, guaranteed indefinite offline availability, background push alerts, or guaranteed background sync while the app is closed. Browsers may clear/evict caches and IndexedDB. Recheck Offline Kit readiness before travel. Calling emergency services requires cellular connectivity.

## Existing Cloudflare Pages deployment

PathVirgil is hosted at **https://pathvirgil.pages.dev/**. To update the existing project, follow `FINAL_RELEASE_GUIDE.md` and `docs/PAGES_DEPLOYMENT.md`. Keep the real local `wrangler.jsonc` with its current D1 database binding; use the checked-in example only for reference. **Do not create a new Pages project or D1 database** to publish this release.

A website deployment does not require a mobile app store, Android SDK, or APK.

## Setup

Requirements for development: Node 24 recommended (some tests use `node:sqlite`) and pnpm 11.25.0. No Android SDK or APK tooling is needed for this PWA release.

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

## Platform support

This hackathon release is a **web/PWA submission**, tested through its hosted Cloudflare Pages URL. Android and iOS users can install the PWA using browser-provided home-screen installation. An optional Android WebView wrapper and APK build scripts remain in source for future development, but no APK is being submitted or represented as an already built release. No native iOS build is included.

## Architecture and validation

See docs/ARCHITECTURE.md, docs/TESTING.md and docs/EVALUATION.md. Run pnpm test for offline storage, UI logic, service-worker cache, CAP filtering and API security/workflow checks. Tests simulate transport/device APIs and use SQLite; they do not certify all browsers or devices.

See [Cloudflare Pages deployment and updates](docs/PAGES_DEPLOYMENT.md) for the Pages release process.

See docs/DEPENDENCIES.md and docs/dependencies.json for open-source/API disclosure, docs/PRIVACY.md for data handling, and docs/SUBMISSION.md for the remaining submission items. A 2–5 minute demo video is required by the hackathon; add it to the repository before the submission deadline.

## Limits of the pilot

PathVirgil is a hackathon prototype, not a rescue dispatcher or a guarantee that a route or place is safe. Follow current local authorities. No live designated shelter is invented: absence of a confirmed listing directs users to disaster control. The current pack is local, not worldwide coverage.

The optional classifier can be wrong. Its output is a model score, not an authenticity probability; it cannot prove an event happened, where, or when. Missing metadata is not evidence of fakery. C2PA marker presence is detected but signatures are not validated. No reverse-image search or forensic certification is claimed. Independent human corroboration remains necessary.

Official bulletins retain their original text. Essential hazard labels and preparedness guidance are translated; arbitrary source text and community descriptions are not automatically translated. Translations require local expert review before operational deployment.

Automatic refresh/sync runs while the app is open or resumes. Background push notifications, guaranteed closed-app sync, emergency dispatch, verified routing and national shelter coverage are not implemented.


## October 10 feature updates

See `docs/NEW_FEATURES_2026-10-10.md`, `docs/PATHVIRGIL_TRANSLATION_REVIEW.md`, and `LOCATION_SIMULATION_UPDATE.md` (if present) for consented GPS, 15-language safety guidance, air quality, satellite toggles, nearby emergency-service lookup, moderator address entry, multiple clearly simulated scenarios, and the **Other incident** category. Regenerate the offline bundle using `pnpm offline:build` before deployment. Verify that the latest source includes each claimed update.


## Community verification / hackathon judge access

The Community Reports page separates **Unverified community submissions** from reviewed observations. Unreviewed descriptions, landmark details, and precise coordinates are not shown publicly. These are not official emergency alerts.

The protected Moderator Dashboard (`/#review`) can support two different access keys as **Cloudflare Pages encrypted production secrets** (never store keys in code):

- `MODERATOR_ACCESS_TOKEN`: team moderator, can view evidence and change review decisions/publish sourced shelters.
- `JUDGE_ACCESS_TOKEN`: optional, separate **read-only** judge key, allowing inspection but no review or notice changes. **Not enabled unless configured** (the last confirmed production setup used only the moderator key).

The server refuses authentication if both configured secrets are identical. See `docs/JUDGE_ACCESS_QUICKSTART.md` for configuration. Judges can receive temporary moderator access through the organizers' **private submission channel** if read-only judge access is not enabled, but this grants full moderator privileges. Never publish keys in the README or GitHub history. Rotate shared keys after the event.
