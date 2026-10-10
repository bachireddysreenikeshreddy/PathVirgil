# Architecture

## Components

| Layer | Implementation | Responsibility |
|---|---|---|
| Client | ES modules, HTML, responsive CSS, Leaflet | Accessible navigation, maps, translated guidance, forms |
| Offline shell | Versioned service worker | Verified core cache; offline navigation fallback |
| Device data | IndexedDB | Preferences, last source snapshots, report outbox and private receipt |
| API | Vinext route on Cloudflare Worker | Input validation, source adapters, report handling, authorization |
| Structured storage | Cloudflare D1 / Drizzle migrations | Reports, audit events, source cache, rate limits, shelter notices |
| Photo storage | Private Cloudflare R2 | Original evidence available only to reporter receipt or reviewer |
| Optional ML | Transformers.js, ONNX WASM worker | Experimental image screening on device |
| Android | Java WebView over intercepted HTTPS assets | Bundled offline shell, image chooser, location permission, external calls |

## Offline lifecycle

The service worker precaches only local core files; no third-party tile bulk download, API response or private image is cached by it. IndexedDB holds explicitly selected source snapshots and the user's report data. A readiness check verifies every precache entry and performs an IndexedDB write/read probe. It does not equate navigator.onLine with successful downloads.

A report and optional Blob are saved before a network call. The app uploads while open and connected, then marks it sent only after an acknowledgement. The client keeps its UUID and 256-bit receipt on retries. The server stores only the receipt hash and has a unique (client_id, receipt_hash) index. A race loser removes its unused upload and returns the existing record.

Expired alerts and public cautions disappear. Feed failure is distinct from zero current bulletins. Old weather remains marked stale. Saved contacts/map/precautions remain available.

## Evidence and publication

Incoming reports are pending and absent from public feeds. Exact image duplicates cannot count as separate supporting images. EXIF mismatches and generator-related metadata create review flags; absence of evidence does not clear a report. Client-side ML results never authorize a server-side status change.

Only the configured moderator may publish a corroborated caution or an app-reviewed report. App-reviewed confirmation requires an explicit independent-evidence attestation and reason. Optimistic version checks prevent lost edits. D1 batch records the transition and audit together. Withdrawal and expiry remove a report from public listings.

“App-reviewed” is distinct from government verification. Shelter notices require a source link and have a six-hour expiry; their availability may still be unknown. A place's proximity is never converted into a safe-route claim.

## Source updates

- Open-Meteo: current estimates and 48-hour hourly forecast, cached 10 minutes.
- MET Norway: fallback forecast with identifying User-Agent, Last-Modified conditional requests and upstream Expires respected. Rain probability is displayed as unavailable rather than invented.
- SACHET RSS: conditional ETag requests, cached 2 minutes. Up to 20 relevant CAP documents per refresh; truncated or failed coverage is marked partial. Actual messages only; duplicate IDs, update references and cancellations are handled within the fetched set.
- EUMETSAT: live capabilities select the IR layer's observation time; eight 15-minute frame requests over the Indian Ocean region.
- OSM: bundled small vector extract under ODbL; normal interactive tiles only while online.

Source latency, provider outages and delayed official publication are observable constraints. A successful request is not evidence that every hazard is covered. More extensive CAP history, provider redundancy, signed shelter feeds, moderator staffing and cross-device identity are future production work.
