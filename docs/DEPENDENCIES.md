# Open-source, data and model disclosure

Versions are pinned in pnpm-lock.yaml; direct packages and declared licenses are listed in dependencies.json. The project uses a web framework starter. Some starter UI dependencies remain installed but are not used by Harbor's lightweight client.

| Component | Purpose | Attribution / terms |
|---|---|---|
| React, Next, Vinext, Vite | Server framework and build | Respective upstream licenses; package disclosure |
| Cloudflare Workers, D1, R2, Wrangler | Hosted compute, database, files and tooling | Cloudflare service terms |
| Drizzle ORM / Kit | Schema and migrations | Apache-2.0 |
| Leaflet 1.9.4 | Interactive maps | BSD-2-Clause; vendor LICENSE included |
| fast-xml-parser | CAP/RSS parsing | MIT |
| exifr | Photo metadata | MIT |
| Transformers.js 3.8.1 | Experimental image screening | Apache-2.0 |
| ONNX Runtime | Model execution | MIT |
| onnx-community/ai-image-detection-ONNX | Quantized experimental real/generated classifier | Model card declares Apache-2.0; https://huggingface.co/onnx-community/ai-image-detection-ONNX |
| Happy DOM, fake-indexeddb, tsx | Test environment | Package disclosure |
| Android SDK/JDK | APK compilation/signature tooling | Respective SDK/JDK terms; SDK binaries are not redistributed |
| OpenStreetMap contributors | Downloaded pilot roads/help locations and online tiles | ODbL, https://www.openstreetmap.org/copyright |
| NDMA SACHET / issuing agencies | Official CAP warnings | https://sachet.ndma.gov.in/ |
| Open-Meteo | Model-based current/hourly weather | CC BY 4.0 attribution and API service terms; free non-commercial endpoint |
| MET Norway | Forecast fallback; wind units/timezone adapted | CC BY 4.0; https://www.met.no/en/free-meteorological-data/Licensing-and-crediting |
| EUMETSAT | Indian Ocean infrared satellite observations | © EUMETSAT; https://view.eumetsat.int/ and provider terms |
| IMD Chennai / Government of India | Preparedness source material | Source links in app; curated summaries, not verbatim full bulletins |
| ERSS / Chengalpattu district | Emergency and disaster control numbers | https://112.gov.in/ ; https://chengalpattu.nic.in/helpline/ |

The model's training distribution and false-positive/negative risk make it unsuitable as a standalone fact checker. Its two labels are shown as raw model scores, not calibrated probabilities. C2PA signature validation and reverse-image search are not implemented.

No proprietary weather-app screenshots, copied branding or AI-generated disaster photos are used as live evidence. The Harbor icon is code-drawn. Simulation bridge/shelter locations are invented for the exercise and visibly marked.

No blanket license is assigned to third-party data. Preserve upstream attribution and review provider terms before commercial use or broad redistribution.
