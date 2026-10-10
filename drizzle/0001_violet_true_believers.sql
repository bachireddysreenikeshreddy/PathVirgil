DROP INDEX `reports_client_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `reports_retry_key` ON `reports` (`client_id`,`receipt_hash`);