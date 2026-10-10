# Validation record

## Automated checks

Run pnpm test. The suite covers:

- Report time/category/coordinate validation and non-image rejection.
- Private photo and receipt authorization.
- Pending reports excluded from public listings.
- Idempotent retry and database uniqueness.
- Anonymous moderator rejection; evidence gate for confirmation.
- Audit insertion, conflicting edits, withdrawal and expiry.
- Duplicate-image flagging without an authenticity claim.
- Untrusted origins, payload-size header checks and rate limiting.
- Sourced shelter authorization and validation.
- CAP geography, actual/test status, expiration, cancellation and stale-source fallback.
- All four translations present for every defined message.
- IndexedDB persistence of a photo-bearing queue.
- Service-worker inventory, missing-file detection, cache repair, offline navigation and exclusion of API requests.
- DOM interaction checks for offline translated guidance, unsent reports, simulation separation and accommodation cards.

TypeScript noEmit and the production Vinext build are additional gates.

## Live checks performed on 10 October 2026

- SACHET RSS/CAP integration: successful response, zero current pilot alerts in the sample. This is not a safety declaration.
- EUMETSAT IR capabilities and image: successful, a timestamped PNG returned.
- Open-Meteo: live JSON returned through the external HTTP check; one Node check timed out. Source timeouts/fallback are handled explicitly. Deployment API smoke results are recorded separately.
- The actual quantized ONNX model completed CPU inference on a synthetic app icon. This confirms execution, not detector accuracy or mobile performance.
- Android APK compilation, Android manifest inspection and v2/v3 signature verification passed.

## Verification limits

No controlled browser preview tool, Android emulator, iPhone or physical Android device was available. DOM tests do not prove layout, browser service-worker behavior, native geolocation, image picking, on-device WASM performance or actual airplane-mode cold launch. The APK is a development build; native iOS has not been built.

Before judging, perform the following device checks:

1. iOS Safari and Android Chrome: save the kit, install, close, enable airplane mode, reopen, change language and read precautions.
2. Check contacts/help card/map and accommodation offline. Do not place test calls to real emergency numbers.
3. Queue a clearly simulated report; reconnect and confirm one acknowledgement.
4. Use local Simulation for moderation/withdrawal. Check Live has no simulated incidents.
5. Pan the map, run timestamp playback, deny location permission and enter coordinates manually.
6. Upload JPEG/PNG/WebP within 4 MB; test rejection and model-unavailable behavior.
7. Repeat at 360, 768 and 1440 CSS pixel widths, 200% zoom, keyboard-only and screen-reader navigation.
8. Android APK: cold-launch offline, choose photo, deny/allow location, and check external dialer handoff without making a call.

No claim of disaster-readiness, expert-reviewed translations or classifier accuracy is made.

## Hosted checks

The deployment service reported a successful public release. Supported authenticated service access verified the HTML shell, service worker, manifest, health, report/notice feeds, anonymous session state, protected review rejection, official alerts and satellite metadata. Unauthenticated automated Python access was rejected by hosting bot protection; this differs from the app's browser access. The initial hosted weather adapter returned unavailable, so MET Norway was added as a source-labeled fallback.

A simulated hosted report with a synthetic icon was saved as pending. Retrying returned the same ID; receipt-authorized report/photo reads succeeded, unauthenticated reads were denied, and the live public feed remained empty. This verifies D1/R2 persistence and retry behavior without publishing a simulated incident.

The offline navigation regression fixture includes a redirected/encoded cached response. The fallback rebuilds a clean response and removes stale transfer headers, so a cached canonical-URL redirect is not replayed as a navigation redirect.
