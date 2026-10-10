# Publish Harbor and generate the updated Android APK

The Cloudflare Pages website must be deployed **first**. You need the real HTTPS `.pages.dev` URL from its successful deployment, not a placeholder.

## Publish to GitHub

1. Sign in at <https://github.com/new>. Create a **new, empty** repository for Harbor. Do not initialize it with a README or license because Harbor contains its own documentation. Do not upload the source archive as a single ZIP: upload its **contents**, preserving `.github/workflows/build-android.yml`.
2. Extract Harbor, open PowerShell in the `Harbor` directory, and run:

   ```powershell
   git init
   git add .
   git status
   git commit -m "Harbor offline-first tourist safety app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

   If the folder is already a repository, do not reinitialize it; check its remote and push to the correct repository. GitHub may open a browser for sign-in. Never paste a personal access token into chat. Before committing, inspect `git status` for secrets, `.env` files, private data, caches, or signing keys. The supplied `.gitignore` excludes those by default.
3. Under the new GitHub repository, open **Settings → Secrets and variables → Actions → Variables**. Add `HARBOR_APP_ORIGIN` with the exact publicly accessible HTTPS `pages.dev` origin. This is a public URL, **not** a secret.
4. Open **Actions → Build Harbor Android APK → Run workflow**. Wait until it succeeds. Open its artifacts, download `Harbor-Android`, extract the archive, and install/test `Harbor-Android.apk` on a real Android phone.
5. A new development signing key may prevent updating an older Harbor installation in-place. First resolve pending offline reports, then remove the old development build only if needed. Verify basic offline opening with airplane mode, online weather/API functionality, and correct Harbor branding.

## What needs a person

- Cloudflare account creation and OAuth login, and optional R2 account activation (possible billing setup). Do not share passwords or tokens.
- GitHub repository creation. The connected GitHub integration can inspect existing repositories, but may not offer repository creation.
- Verify the production website and Android APK on actual devices.
- Record and add the **mandatory 2–5 minute demo video** to the repository, then submit the project before the competition deadline.

## Troubleshooting

If the build job fails, inspect the first failed step and its logs. The `.github/workflows/build-android.yml` job installs Android SDK tools and Java 17 and signs a development APK. An existing APK is **not** updated merely by deploying the website; re-running the workflow creates the replacement binary.
