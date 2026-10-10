-- Limited-size private evidence storage for card-free Cloudflare D1 deployments.
-- Photos are accessible only with a private report receipt or moderator authorization.
CREATE TABLE IF NOT EXISTS report_photos (
 report_id TEXT PRIMARY KEY NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
 bytes BLOB NOT NULL,
 content_type TEXT NOT NULL,
 created_at TEXT NOT NULL
);
