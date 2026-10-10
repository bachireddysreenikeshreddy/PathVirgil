# PathVirgil — community moderator and judge access

## Who can access what

- **Public Community Reports:** Displays reviewed observations separately from **UNVERIFIED** submissions. Unverified descriptions, landmarks and precise locations are withheld pending review. These are never presented as official weather alerts.
- **Team moderator:** Signs in at `https://pathvirgil.pages.dev/#review` using the Cloudflare Pages secret `MODERATOR_ACCESS_TOKEN`. Can review reports, view private photo evidence and publish sourced shelter notices.
- **Judge:** Signs in on the same restricted dashboard using the independent `JUDGE_ACCESS_TOKEN`. Can inspect reports and private photo evidence, but cannot approve/reject incidents or publish notices. The backend enforces read-only access.

## Set up safely

1. Copy this update into the **existing Harbor project folder**, leaving `wrangler.jsonc` and local Cloudflare configuration unchanged.
2. Preview before production: `node scripts/generate-sw.mjs`, then `node scripts/preflight-pages.mjs`, followed by `wrangler pages deploy public --project-name pathvirgil --branch moderator-preview`.
3. Generate a unique **32+ character random judge key**. Set it as a Cloudflare Pages **production environment secret** named `JUDGE_ACCESS_TOKEN`. Do not put it in a source file, screenshots, chat, git, or frontend code.
4. Ensure the team moderator has a **different** 32+ character secret named `MODERATOR_ACCESS_TOKEN`.
5. Redeploy the updated production source: `wrangler pages deploy public --project-name pathvirgil --branch main`. Verify `/api/session` has no role when signed out. Sign in to `/#review` with a judge key; actions must be absent and POST `/api/review/<id>` must return 403.
6. Share the judge key **privately**, preferably once, directly with the panel. Rotate/remove it from Cloudflare Pages Secrets after the event. Never share your team moderator key with judges.

Cloudflare Pages dashboard: **Workers & Pages → pathvirgil → Settings → Variables and Secrets**. Select **Production** for the live site. Put each secret under its exact name; select encrypted/secret, not plain text. Allow the platform to publish/redeploy the updated settings.

**Privacy:** Judge access exposes user-uploaded evidence and incident descriptions. Obtain appropriate consent or use clearly labeled simulated reports for the demonstration. Do not promise official verification.

**If no judge secret is configured, judges cannot sign in**, but anyone can view the separated public community feed. Judge access is not enabled merely by deploying the frontend.
