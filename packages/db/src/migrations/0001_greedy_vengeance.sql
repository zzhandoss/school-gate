CREATE TABLE `terminal_directory_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`terminal_person_id` text NOT NULL,
	`iin` text,
	`display_name` text,
	`user_type` text,
	`user_status` text,
	`authority` text,
	`valid_from` text,
	`valid_to` text,
	`card_no` text,
	`card_name` text,
	`source_summary_json` text,
	`raw_user_payload` text,
	`raw_card_payload` text,
	`payload_hash` text NOT NULL,
	`is_present_in_last_sync` integer DEFAULT true NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_sync_run_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tde_device_terminal_unique` ON `terminal_directory_entries` (`device_id`,`terminal_person_id`);--> statement-breakpoint
CREATE INDEX `tde_iin_idx` ON `terminal_directory_entries` (`iin`);--> statement-breakpoint
CREATE INDEX `tde_device_idx` ON `terminal_directory_entries` (`device_id`);--> statement-breakpoint
CREATE INDEX `tde_present_idx` ON `terminal_directory_entries` (`is_present_in_last_sync`);--> statement-breakpoint
CREATE INDEX `tde_last_seen_idx` ON `terminal_directory_entries` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `terminal_directory_sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`requested_by_admin_id` text,
	`status` text NOT NULL,
	`include_cards` integer DEFAULT true NOT NULL,
	`page_size` integer NOT NULL,
	`target_json` text NOT NULL,
	`device_count` integer DEFAULT 0 NOT NULL,
	`processed_device_count` integer DEFAULT 0 NOT NULL,
	`entry_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`summary_json` text,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE INDEX `tdsr_started_at_idx` ON `terminal_directory_sync_runs` (`started_at`);--> statement-breakpoint
CREATE INDEX `tdsr_status_idx` ON `terminal_directory_sync_runs` (`status`);