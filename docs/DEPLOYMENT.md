# Deployment and operations

## Independent hosting

Harbor uses Cloudflare Workers, D1 and R2. `.hosting/hosting.json` declares the local database and object-store binding names. Deploy this project to a hosting account you control and use your own HTTPS address; changing source strings does not change an existing site address. Provision the actual D1 database and R2 bucket in that account, apply migrations, and supply the bindings and secrets. This ZIP is source only and is not a deployed site.

Server-only configuration:
- MODERATOR_ACCESS_TOKEN: a cryptographically random secret of at least 32 characters, securely configured on the server.
- PUBLIC_APP_ORIGIN: canonical HTTPS origin.

The public app permits anonymous reading/reporting. Reviewer endpoints require a private Bearer access key matching the server secret. Protect this key and rotate it if exposed; the client keeps it only in session storage.

## Schema

    pnpm db:generate

Inspect generated migrations and commit them. Existing applied migrations are immutable. Use the starter's supported local D1 migration workflow for a local development database; apply production migrations through your own deployment process.

For production, provision D1/R2, bind DB/BUCKET, apply drizzle/*.sql in order using Wrangler D1 execution, build with pnpm build, and set MODERATOR_ACCESS_TOKEN and PUBLIC_APP_ORIGIN. The generated dist/server/wrangler.json has placeholder resources until hosting binds real ones. Direct static hosting alone is insufficient.

## Builds

    pnpm offline:build
    pnpm test
    pnpm typecheck
    pnpm build

The offline manifest hashes the core files. Regenerate it after any frontend/data change. Rebuild the APK after changing shared client files. scripts/package-source.py packages a source snapshot without credentials or build caches.

External dependencies: NDMA SACHET, Open-Meteo, EUMETSAT WMS, optional OSM tiles, and Hugging Face model downloads. Service failure must surface as unavailable/stale; it must not create a “safe” result.

## Operations before wider rollout

Establish trained moderators and escalation responsibilities, validate translations and contacts with local authorities, add a licensed current shelter feed, measure low-memory device behavior, set retention/erasure procedures and abuse controls, and monitor provider limits. Back up D1, protect R2 access, and rotate/restrict moderator membership.

The prototype refreshes on launch, reconnection, visibility resume and once per minute while open. It has no scheduled server worker or push notification service.

## Changing the site address

1. Choose a host such as Cloudflare Workers with a `workers.dev` subdomain, or connect a domain you own.
2. Configure the Worker, its D1/R2 bindings, migrations, server secrets, TLS and canonical origin.
3. Deploy the backend and frontend together and confirm `/api/health` and `/app/index.html` work from the new domain.
4. In the Android app, set the **Harbor server address** to the new HTTPS origin. Rebuild the APK from this source, sign it, and test offline/online functionality.
5. Update your GitHub README and submission links to the actual deployed address; never advertise an undeployed example domain.

The previous hosted address is not transferred or renamed by editing files in this archive.
