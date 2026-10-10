# Harbor Cloudflare Pages root 404 fix

Cloudflare Pages requires `public/index.html` for the bare `pathvirgil.pages.dev/` URL.
This release copies the existing `/app/index.html` into `/index.html` (its `<base href="/app/">` resolves all the assets correctly).
It removes the conflicting `_redirects` file and updates the build/preflight tests.

## Quick fix in your existing Windows folder (no reinstallation or re-creation of D1)

Open PowerShell in your existing Harbor folder and run:

```powershell
Copy-Item .\public\app\index.html .\public\index.html -Force
Remove-Item .\public\_redirects -Force -ErrorAction SilentlyContinue
.\node_modules\.bin\wrangler.cmd pages deploy .\public --project-name pathvirgil --branch main
```

The third command does not create a new project and should not reapply D1 migrations.
Check `https://pathvirgil.pages.dev/` and `https://pathvirgil.pages.dev/app/index.html`.
Also test `https://pathvirgil.pages.dev/api/health`.

## Future deployments

Use the updated scripts in this ZIP; `offline:build` now regenerates the root page
and deletes the conflicting redirect automatically.
