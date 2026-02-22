CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`direction` text NOT NULL,
	`adapter_key` text NOT NULL,
	`settings_json` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `devices_direction_idx` ON `devices` (`direction`);--> statement-breakpoint
CREATE INDEX `devices_enabled_idx` ON `devices` (`enabled`);--> statement-breakpoint
CREATE TABLE `device_events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`event_id` text NOT NULL,
	`direction` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`terminal_person_id` text,
	`raw_payload` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_events_device_event_idx` ON `device_events` (`device_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `device_events_device_time_idx` ON `device_events` (`device_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `device_outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processing_at` integer,
	`processing_by` text,
	`processed_at` integer
);
--> statement-breakpoint
CREATE INDEX `device_outbox_status_created_idx` ON `device_outbox_events` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `device_outbox_status_processing_idx` ON `device_outbox_events` (`status`,`processing_at`);--> statement-breakpoint
CREATE INDEX `device_outbox_type_idx` ON `device_outbox_events` (`type`);