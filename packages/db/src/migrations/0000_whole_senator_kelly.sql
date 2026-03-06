CREATE TABLE `parents` (
	`tg_user_id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`iin` text NOT NULL,
	`terminal_person_id` text,
	`first_name` text,
	`last_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `persons_iin_unique` ON `persons` (`iin`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`tg_user_id` text NOT NULL,
	`iin` text NOT NULL,
	`status` text NOT NULL,
	`resolution_status` text DEFAULT 'new' NOT NULL,
	`person_id` text,
	`resolution_message` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_requests_pending_unique` ON `subscription_requests` (`tg_user_id`,`iin`) WHERE "subscription_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `subscription_requests_resolution_idx` ON `subscription_requests` (`status`,`resolution_status`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`tg_user_id` text NOT NULL,
	`person_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_unique` ON `subscriptions` (`tg_user_id`,`person_id`);--> statement-breakpoint
CREATE TABLE `worker_heartbeats` (
	`worker_id` text PRIMARY KEY NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_started_at` integer,
	`last_success_at` integer,
	`last_error_at` integer,
	`last_error` text,
	`meta_json` text
);
--> statement-breakpoint
CREATE INDEX `worker_heartbeats_updated_at_idx` ON `worker_heartbeats` (`updated_at`);--> statement-breakpoint
CREATE INDEX `worker_heartbeats_last_success_at_idx` ON `worker_heartbeats` (`last_success_at`);--> statement-breakpoint
CREATE INDEX `worker_heartbeats_last_error_at_idx` ON `worker_heartbeats` (`last_error_at`);--> statement-breakpoint
CREATE TABLE `access_events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`direction` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`iin` text,
	`terminal_person_id` text,
	`idempotency_key` text NOT NULL,
	`raw_payload` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer,
	`processing_at` integer,
	`processing_by` text,
	`last_error` text,
	`processed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_events_idempotency_unique` ON `access_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `access_events_device_time_idx` ON `access_events` (`device_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `access_events_status_idx` ON `access_events` (`status`);--> statement-breakpoint
CREATE INDEX `access_events_next_attempt_idx` ON `access_events` (`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `access_events_processing_idx` ON `access_events` (`processing_at`);--> statement-breakpoint
CREATE TABLE `person_terminal_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`device_id` text NOT NULL,
	`terminal_person_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pti_device_terminal_unique` ON `person_terminal_identities` (`device_id`,`terminal_person_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pti_person_device_unique` ON `person_terminal_identities` (`person_id`,`device_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`meta_json` text,
	`at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audit_logs_event_id_unique` ON `audit_logs` (`event_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_at_idx` ON `audit_logs` (`actor_id`,`at`);--> statement-breakpoint
CREATE INDEX `audit_logs_at_idx` ON `audit_logs` (`at`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
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
CREATE INDEX `outbox_events_status_created_idx` ON `outbox_events` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `outbox_events_status_processing_idx` ON `outbox_events` (`status`,`processing_at`);--> statement-breakpoint
CREATE INDEX `outbox_events_type_idx` ON `outbox_events` (`type`);--> statement-breakpoint
CREATE TABLE `admin_invites` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`email` text,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `admin_invites_role_id_idx` ON `admin_invites` (`role_id`);--> statement-breakpoint
CREATE INDEX `admin_invites_created_by_idx` ON `admin_invites` (`created_by`);--> statement-breakpoint
CREATE INDEX `admin_invites_email_idx` ON `admin_invites` (`email`);--> statement-breakpoint
CREATE TABLE `admin_tg_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`purpose` text DEFAULT 'link' NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_tg_codes_admin_id_idx` ON `admin_tg_codes` (`admin_id`);--> statement-breakpoint
CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`name` text,
	`tg_user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `admins_tg_user_id_unique` ON `admins` (`tg_user_id`);--> statement-breakpoint
CREATE INDEX `admins_role_id_idx` ON `admins` (`role_id`);--> statement-breakpoint
CREATE TABLE `password_resets` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `password_resets_admin_id_idx` ON `password_resets` (`admin_id`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`rotated_at` integer,
	`revoked_at` integer,
	`replaced_by` text,
	`device_id` text,
	`ip` text,
	`user_agent` text,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `refresh_tokens_admin_id_idx` ON `refresh_tokens` (`admin_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_expires_at_idx` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `role_permissions_role_id_idx` ON `role_permissions` (`role_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `monitoring_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`snapshot_json` text NOT NULL,
	`outbox_new_count` integer NOT NULL,
	`outbox_oldest_new_at` integer,
	`access_oldest_unprocessed_at` integer
);
--> statement-breakpoint
CREATE INDEX `monitoring_snapshots_created_at_idx` ON `monitoring_snapshots` (`created_at`);--> statement-breakpoint
CREATE TABLE `alert_events` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`snapshot_id` text,
	`status` text NOT NULL,
	`severity` text NOT NULL,
	`message` text NOT NULL,
	`details_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`rule_id`) REFERENCES `alert_rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `monitoring_snapshots`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `alert_events_rule_id_idx` ON `alert_events` (`rule_id`);--> statement-breakpoint
CREATE INDEX `alert_events_status_idx` ON `alert_events` (`status`);--> statement-breakpoint
CREATE INDEX `alert_events_created_at_idx` ON `alert_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`config_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `alert_rules_type_idx` ON `alert_rules` (`type`);--> statement-breakpoint
CREATE INDEX `alert_rules_enabled_idx` ON `alert_rules` (`is_enabled`);--> statement-breakpoint
CREATE TABLE `alert_subscriptions` (
	`admin_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`admin_id`, `rule_id`),
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rule_id`) REFERENCES `alert_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `alert_subscriptions_admin_id_idx` ON `alert_subscriptions` (`admin_id`);--> statement-breakpoint
CREATE INDEX `alert_subscriptions_rule_id_idx` ON `alert_subscriptions` (`rule_id`);--> statement-breakpoint
CREATE INDEX `alert_subscriptions_enabled_idx` ON `alert_subscriptions` (`is_enabled`);
