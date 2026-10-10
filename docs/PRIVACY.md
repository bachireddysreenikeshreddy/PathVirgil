# Privacy and evidence handling

The device stores language, accommodation details, downloaded public snapshots, report text/location/time, private receipt and optional photo in IndexedDB. Unsent reports can be deleted in My reports. Clearing browser/app data removes local copies and access receipts.

Submitting a report sends its description, landmark, observation time, coordinates and optional photo to Harbor's backend. Photos may contain EXIF information; the server inspects it for time/location discrepancies and stores the original privately. Photos are not in the public report feed. The reporter's secret receipt or authenticated moderator can retrieve a photo.

Reviewed/corroborated report text, approximate supplied location, observation time, decision note and expiry are public. Do not submit faces, documents, phone numbers or other identifying details unless necessary and appropriate. This application is not an emergency dispatch channel.

The optional classifier downloads model/runtime files from Hugging Face and runs image inference on the device. A local screening result does not publish a report or verify it. Third-party providers receive normal connection information when maps, weather or model files are requested.

The prototype stores reports/photos until an operator removes them; expiry removes public visibility, not the underlying record. A formal retention and erasure process is required before public operational use. No advertising or analytics SDK is included. Request-IP hashes are used for hourly submission rate limits.

Simulation data and decisions remain on the device. Automated tests use synthetic fixtures. Live simulation records, if explicitly submitted using the test API flag, are separated from the normal public feed.


**Current-device geocoding:** When online and GPS permission is granted, Harbor may send the current device coordinates to BigDataCloud’s browser-only reverse-geocoding service to label a city/region. This is not a private/local lookup. GPS can be denied. See provider privacy policy and fair-use requirements.
