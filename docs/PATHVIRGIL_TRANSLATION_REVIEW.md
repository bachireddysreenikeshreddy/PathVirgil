# PathVirgil: language and safety review

Version 1.2 updates the visible app/PWA/Android name to **PathVirgil**.

The app includes draft localized emergency action steps for all **15 language choices**:
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, French, Spanish, German, Arabic, Japanese.

The added languages include complete entries for every emergency-guide category (flood, cyclone, thunderstorm, damaged bridge, fallen power line, fallen tree, landslide, shelter guidance, general advisory) and key warning and uncertainty labels. The original authority bulletin remains unaltered for traceability.

**Safety warning:** These translations are draft translations, *not* certified by native speakers or local disaster management authorities. Do not rely on this hackathon prototype as an official emergency warning or rescue dispatch service. Obtain professional language and emergency-guidance review before real-world use.

Some noncritical UI text still falls back to English; the interface discloses this when one of the newly added languages is chosen. Language selection works offline because strings are shipped with the application.

The existing D1/R2 names, Android application ID, and local storage keys retain their old internal identifiers so that deployment bindings and saved reports are not silently lost. Only user-facing branding and the new APK filename change. The updated Android APK is **not** included; rebuild with the GitHub Actions workflow.

Deploy a preview first, test all 15 languages in airplane mode and verify longer strings/RTL rendering, then promote to production.
