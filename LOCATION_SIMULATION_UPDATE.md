# PathVirgil — nearby help, moderator address and realistic scenario update

This source is based on PathVirgil-FINAL-Complete-Source.zip. It preserves the Pages API, Cloudflare D1 report/photos, role checks, 15 languages, PWA and Android sources.

## Changes
- Nearby Help queries OpenStreetMap/Overpass for hospitals, police, clinics, fire stations and assembly points around the selected GPS location when online. Shows published phone tags and address tags only; otherwise provides a direct OSM source link and transparent unknown-address/phone labels. Search radius 12 km; requires connectivity and may be rate-limited. The bundled Mamallapuram records only serve as an offline pilot fallback near that region.
- Moderator shelter/notice form now accepts a human-readable street/area address with a "Find address" lookup (Nominatim) or "Use My Location" through permission-gated GPS. Both resolve internally to coordinates required by the existing backend; neither coordinate input is shown to reviewers. A source URL and availability state remain mandatory; verify accuracy manually.
- Simulation supports Chennai, Kochi and Mumbai, each with 12 fictional community updates timestamped at intervals and locally generated simulation shelter information. Simulation never publishes to live incidents. Do not mistake these scenario reports for real alerts.

## Release safely

1. Work in the existing PathVirgil folder and retain your **local** `wrangler.jsonc` (production D1 binding) and secret configuration. This source ZIP deliberately does not include it.
2. Run `npm install` if node_modules is absent; then `npm run offline:build`, `npm test`, `npm run typecheck`, `node scripts/preflight-pages.mjs`.
3. Preview: `.\\node_modules\\.bin\\wrangler.cmd pages deploy .\\public --project-name pathvirgil --branch location-preview`. Do not write test reports or notices to the production database from a preview.
4. After review, production: `.\\node_modules\\.bin\\wrangler.cmd pages deploy .\\public --project-name pathvirgil --branch main`.
5. Hard reload. Verify GPS location, map listings, moderator form with privately held key, and distinct fictional scenario markers. No D1 schema changes are required.

## Caveats

OpenStreetMap listing coverage/quality varies. Some businesses lack published phone/address; do not invent them. No facility's current availability, safety, or access route is guaranteed. Browser geolocation, Nominatim and Overpass depend on network/service uptime. Existing official alert coverage is pilot-limited. Existing Android APK must be rebuilt for the new interface.
