# Cloudflare Pages config-path fix (Wrangler 4.92+)

A Pages deploy can fail with `Pages does not support custom paths for the Wrangler configuration file` if the command passes `--config wrangler.pages.json`. Pages deployment must discover its standard `wrangler.jsonc` file in the project root.

If you already ran D1 migrations and created the `pathvirgil` Pages project, you do **not** need to create those resources again. From the Harbor directory in Windows PowerShell, run:

```powershell
Copy-Item .\wrangler.pages.json .\wrangler.jsonc -Force
.\node_modules\.bin\wrangler.cmd pages deploy public --project-name pathvirgil --branch main
```

Use the project's real configured D1 UUID from `wrangler.pages.json`. No API tokens or passwords belong in these files or in your chat messages.

For **subsequent** deployments after editing code, `scripts/deploy-pages.ps1 -ExistingProject -WithoutPhotos` will regenerate the config and use the default config-path-aware command. It will ask for the existing D1 UUID, and will only apply outstanding migrations.

Cloudflare docs: https://developers.cloudflare.com/pages/functions/wrangler-configuration/
