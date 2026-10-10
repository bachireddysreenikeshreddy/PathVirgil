# Windows fast-track: deploy Harbor on free Cloudflare hosting

This route uses the supplied guided PowerShell script. It does **not** sign you up for Cloudflare, bypass account authorization, create a GitHub repository, or hide provider fees. The deploy script needs an internet-connected Windows computer and your explicit Cloudflare browser login.

1. Create a Cloudflare account at <https://dash.cloudflare.com/sign-up> and enable its default `.workers.dev` subdomain under **Workers & Pages**. R2 may require activation/billing setup; review Cloudflare's terms before enabling it.
2. Install **Node.js 24** or a supported Node.js 22 version, then extract this ZIP and open **Windows PowerShell** inside the extracted `Harbor` folder.
3. Run the guided deployment (this temporarily allows the downloaded script only for this PowerShell process):

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\deploy-free.ps1
   ```

   The script installs packages, builds offline assets, checks the application, opens Cloudflare login if needed, helps you create a D1 database and a private R2 bucket, applies database migrations, deploys the website, and prompts you to set a moderation key securely via Wrangler.
4. Copy the exact `https://...workers.dev` origin printed by Wrangler into the script's final prompt. It checks `/app/index.html`, `/app/config.js`, `/sw.js`, and `/api/health`.
5. Use [GitHub APK finishing guide](GITHUB_APK_FINISH.md) to publish the source and build the new Android APK. **Without an actual deployment URL, do not claim that the live app and updated APK exist.**

*Safety:* Harbor is a hackathon prototype, not an official warning, shelter-verification, or rescue-dispatch system. Confirm availability, attribution, accuracy, and offline operation through real-device tests.
