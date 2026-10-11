# PathVirgil — Hackathon Submission Details

## 1. Project Information

**Project Name:** PathVirgil

**Domain:** TravelTech

**Problem Statement:** 2 — Real-Time Crisis Communication for Tourists During Extreme Weather Events

**Application Type:** Offline-First Progressive Web App (PWA)

**Live Website:** https://pathvirgil.pages.dev/

**GitHub Repository:** https://github.com/bachireddysreenikeshreddy/PathVirgil

**Hosting Platform:** Cloudflare Pages

**Database:** Cloudflare D1

**Submission Status:** Submitted for hackathon evaluation.

**Tagline:** *Travel with clarity, even in uncertainty.*

---

## 2. Problem Statement and Proposed Solution

Tourists encountering extreme-weather situations may face several difficulties, including:

- Unfamiliar surroundings and emergency facilities.
- Language barriers.
- Limited access to location-specific safety information.
- Unreliable or unavailable internet connectivity.
- Difficulty distinguishing reliable warnings from unverified community information.

PathVirgil addresses these challenges through a unified, location-aware tourist safety platform.

The application combines live environmental information, multilingual emergency guidance, nearby assistance, offline resources, and community-driven incident reporting.

The goal is to help tourists remain informed and prepared without creating unnecessary panic.

---

## 3. Implemented Features

### Weather and Environmental Monitoring

- GPS-based location detection with user permission.
- Weather forecasts and upcoming conditions.
- Rainfall probability, temperature, and wind information.
- Air Quality Index (AQI) monitoring.
- Interactive maps and optional satellite weather imagery.
- Official weather warnings with source information.

### Multilingual Emergency Guidance

- 15 selectable languages.
- Essential emergency instructions and safety precautions.
- Guidance for floods, cyclones, thunderstorms, and other hazards.
- Accessible information for tourists unfamiliar with local languages.

Some noncritical interface strings may fall back to English. Emergency translations require further expert validation.

### Nearby Emergency Assistance

- Nearby hospitals and medical facilities.
- Police stations and relevant emergency services.
- Emergency contact details.
- Map locations and directions where available.

Nearby service availability is not guaranteed during an emergency.

### Offline-First Functionality

PathVirgil uses:

- Progressive Web App technology.
- Service-worker caching.
- IndexedDB and browser storage.
- Locally saved emergency resources.
- Offline incident-report queuing.

Users can prepare offline resources through:

**Offline Kit → Save Essentials → Check Offline Readiness**

After successful preparation, essential cached resources can remain available without internet connectivity.

Live weather updates, fresh alerts, remote map information, and server-side operations require an internet connection.

### Community-Driven Incident Reporting

- Community submissions for local hazards.
- GPS-based incident locations or location descriptions.
- Incident categorization.
- Optional photographic evidence.
- Local queuing when offline.
- Cloudflare D1-backed report storage.
- Clear distinction between unverified and reviewed information.

### Moderator Dashboard

- Protected moderator access through the website.
- Review of submitted incident reports.
- Examination of available photographic evidence.
- Approval and rejection of incident submissions.
- Management of supported community safety notices.

### Emergency Simulation

- Realistic, location-based demonstration scenarios.
- Simulated incidents across selected cities.
- Evolving community updates.
- Demonstration of location-aware crisis information.
- Clear separation between simulated incidents and genuine reports.

**All simulated incidents are fictional demonstration data.**

---

## 4. Deployment Details

PathVirgil is hosted on Cloudflare Pages.

**Production URL:**

https://pathvirgil.pages.dev/

### Deployment Components

| Component | Implementation |
|---|---|
| Website | Cloudflare Pages |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 |
| Database Name | `harbor-production` |
| Photo Evidence | Private D1 storage |
| Offline Resources | Service Worker and IndexedDB |
| Application Format | Installable PWA |

Cloudflare R2 is not required for the current implementation.

The application uses the existing Cloudflare Pages project and production D1 database.

No separate native mobile application is included in this submission.

---

## 5. Moderator Access for Evaluation

The Moderator Dashboard can be accessed at:

https://pathvirgil.pages.dev/#review

### Evaluation Procedure

1. Open the PathVirgil website.
2. Navigate to the Moderator Dashboard.
3. Enter the Moderator Access Key.
4. After successful authentication, access the moderator controls.
5. Review available community incident reports and supporting evidence.

For hackathon evaluation, the moderator key has been provided in:

**`Moderator_Access.txt`**

This file is available in the public GitHub repository for demonstration access.

### Security Disclosure

Because the repository is public, the moderator key is accessible to anyone who visits the repository, not only evaluators.

The published credential is intended for temporary evaluation use. Anyone possessing it may gain moderator privileges.

After evaluation, the credential should be rotated or disabled before the platform is used with sensitive real-world reports.

The moderator role is authenticated through the server-side `MODERATOR_ACCESS_TOKEN` configuration.

---

## 6. Offline Functionality Demonstration

PathVirgil can be installed as a PWA through a compatible browser.

### Demonstration Steps

1. Open https://pathvirgil.pages.dev/ with internet connectivity.
2. Install the PWA using the browser's installation option.
3. Open the Offline Kit.
4. Select **Save Essentials**.
5. Check offline readiness.
6. Disconnect the device from the internet.
7. Reopen the installed PWA.
8. Access saved emergency guidance and other available offline resources.
9. Reconnect to refresh live information and synchronize pending reports.

### Limitations

- Initial setup requires internet access.
- Only previously saved or bundled resources are available offline.
- Browser storage may be cleared or evicted.
- New alerts, live weather, and server moderation require connectivity.
- Offline access does not guarantee that previously downloaded information is current.

---

## 7. Source Code and Documentation

The public GitHub repository includes the application source code, backend functionality, database migrations, offline resources, and technical documentation.

### Main Project Files

| File or Directory | Purpose |
|---|---|
| `README.md` | Project overview, features, and demo video link |
| `FINAL_RELEASE_GUIDE.md` | Final release and deployment details |
| `docs/SUBMISSION.md` | Hackathon submission information |
| `public/` | Website and PWA resources |
| `functions/` | Cloudflare Pages backend routing |
| `lib/` | Application backend and integrations |
| `db/` | Database definitions |
| `drizzle/` | Database migrations |
| `scripts/` | Build and deployment utilities |
| `tests/` | Automated tests |
| `docs/` | Supporting documentation |
| `Moderator_Access.txt` | Public evaluation credential for the moderator dashboard |

Dependency and API attribution is documented in the repository.

The source repository is intended to provide sufficient technical information for evaluation and future development.

---

## 8. Demonstration Video

A demonstration video covering PathVirgil's core functionality has been prepared for the hackathon evaluation.

**The demonstration video link is available directly in the project's [README.md](../README.md).**

The video demonstrates:

1. Team introduction and selected TravelTech problem statement.
2. Overview of PathVirgil and the problem being addressed.
3. GPS-based location detection.
4. Weather, AQI, and interactive maps.
5. Multilingual emergency assistance.
6. Offline Kit and offline-access functionality.
7. Crisis simulation environment.
8. Community incident reporting.
9. Moderator Dashboard.
10. Project conclusion and technical overview.

Evaluators can access the demonstration video through the link provided in the main GitHub README.

---

## 9. Testing and Verification

The application includes tests for important frontend, backend, offline, and reporting functionality.

### Evaluation Checklist

- [ ] Website loads successfully.
- [ ] GPS location access works with permission.
- [ ] Weather information is displayed.
- [ ] AQI and maps function correctly.
- [ ] Language selection works.
- [ ] Emergency assistance information is accessible.
- [ ] Offline Kit saves essential resources.
- [ ] Installed PWA reopens offline after preparation.
- [ ] Community incident reporting works.
- [ ] Photo evidence submission works.
- [ ] Moderator authentication works.
- [ ] Incident review operations function correctly.
- [ ] Simulation incidents are clearly labeled.
- [ ] The demonstration video link is accessible through `README.md`.

This checklist is intended for repeatable verification. Items should be marked complete after confirming them in the deployed application.

---

## 10. Hackathon Timeline and Submission

**Hackathon Development Window:**

9 October 2026, 8:30 PM IST to 10 October 2026, 8:30 PM IST.

**Submission Deadline:**

10 October 2026, 9:00 PM IST.

The team has completed the hackathon submission.

The publicly accessible GitHub repository, deployed PWA, and demonstration video linked through the README serve as the primary project materials for evaluation.

---

## 11. Limitations and Responsible Use

PathVirgil is a hackathon prototype and not an official emergency dispatch system.

Important considerations:

- Live environmental data may be delayed or unavailable.
- Cached information can become outdated.
- Community reports may contain inaccuracies.
- Moderator review does not constitute official verification.
- Nearby emergency facilities may not be operational during extreme-weather events.
- Translations require expert review for critical deployment.
- Offline functionality depends on device and browser storage.
- The public moderator key must not be treated as a confidential production credential.

Users should follow instructions from relevant government authorities and emergency services during real emergencies.

---

## 12. Final Project Summary

PathVirgil demonstrates an integrated tourist safety platform combining:

- Location-aware environmental monitoring.
- Multilingual emergency guidance.
- Nearby assistance.
- Offline-first preparedness.
- Community-driven incident reporting.
- Moderator-based review.
- Realistic emergency simulations.
- Cloudflare-backed deployment and data storage.

The project is submitted as an installable Progressive Web App accessible at:

**https://pathvirgil.pages.dev/**

The demonstration video is linked in the repository's main `README.md` for convenient access by evaluators.

**PathVirgil — Travel with clarity, even in uncertainty.**
