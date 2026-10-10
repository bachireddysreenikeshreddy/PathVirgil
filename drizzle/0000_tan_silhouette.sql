CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`receipt_hash` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`landmark` text NOT NULL,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`observed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`photo_key` text,
	`photo_hash` text,
	`photo_type` text,
	`checks` text NOT NULL,
	`review_note` text,
	`reviewer` text,
	`version` integer DEFAULT 1 NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_status_time` ON `reports` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `reports_photo_hash` ON `reports` (`photo_hash`);--> statement-breakpoint
CREATE INDEX `reports_client_id` ON `reports` (`client_id`);--> statement-breakpoint
CREATE TABLE `source_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`etag` text,
	`fetched_at` text NOT NULL
);
