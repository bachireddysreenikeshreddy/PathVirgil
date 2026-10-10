# Evaluation mapping

Source: supplied Hackathon Problem Statements, Rules and Regulations PDF.

| Criterion | Weight | Implementation evidence | Remaining evidence |
|---|---:|---|---|
| Innovation | 20% | Tourist-focused multilingual offline pack, evidence-aware community flow, source/expiry separation, bilingual help card | Explain design choices in presentation |
| Technical implementation | 35% | PWA + Android wrapper, D1/R2 backend, verified cache inventory, receipt-based retry, private photos, evidence signals, actual ONNX inference, moderator audit/versioning, live adapters | Physical-device and deployed moderator session checks |
| Feasibility | 20% | Bounded local pilot, stale/expiry behavior, honest data gaps, source attribution, optional ML, low-bandwidth essentials | Authority partnerships, translation review, mobile performance and operating costs |
| Video presentation | 15% | Not produced, per user instruction | Record 2–5 minutes and include in GitHub repo |
| Deployment / hosting | 10% | Hosted web application and signed sideload APK; source and setup instructions | Confirm public link and APK on judges' devices |

## Problem fit

The selected domain is TravelTech: “Real-Time Crisis Communication for Tourists During Extreme Weather Events.” The prototype addresses unfamiliar geography, fragmented alerts, language barriers and unverified local reports.

## What judges can exercise

Use Live to inspect source-backed weather/imagery, warnings, contacts and offline readiness. Use clearly labeled Simulation to inspect a flood bulletin, damaged bridge caution, practice shelters and moderator decisions. The simulation runs through actual UI/state transitions; it is not presented as a live incident.

Use the deployed backend for report persistence and the team's private reviewer key for live review. Pending reports do not appear publicly. The Android APK shares the same client and connects to the deployed API while online.

## Honest boundaries

This is a working pilot, not a global finished emergency service. No claim is made that AI establishes ground truth, that arbitrary bulletin text is translated, that all devices were tested, or that any map route is verified safe. See TESTING.md and ARCHITECTURE.md for scope and evidence.
