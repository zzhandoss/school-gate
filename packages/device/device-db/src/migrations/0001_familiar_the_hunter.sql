CREATE TABLE `device_cursors` (
	`device_id` text PRIMARY KEY NOT NULL,
	`last_acked_event_id` text NOT NULL,
	`last_acked_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `device_cursors_updated_at_idx` ON `device_cursors` (`updated_at`);