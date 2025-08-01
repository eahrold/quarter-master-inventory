CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`troop_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`location_side` text NOT NULL,
	`location_level` text NOT NULL,
	`status` text DEFAULT 'available',
	`qr_code` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`troop_id`) REFERENCES `troops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`troop_id` text NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`checked_out_by` text,
	`expected_return_date` integer,
	`notes` text,
	`timestamp` integer,
	FOREIGN KEY (`troop_id`) REFERENCES `troops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `troops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`troop_id` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`troop_id`) REFERENCES `troops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_qr_code_unique` ON `items` (`qr_code`);--> statement-breakpoint
CREATE INDEX `item_qr_idx` ON `items` (`qr_code`);--> statement-breakpoint
CREATE INDEX `item_troop_idx` ON `items` (`troop_id`);--> statement-breakpoint
CREATE INDEX `item_status_idx` ON `items` (`status`);--> statement-breakpoint
CREATE INDEX `item_category_idx` ON `items` (`category`);--> statement-breakpoint
CREATE INDEX `item_location_idx` ON `items` (`location_side`,`location_level`);--> statement-breakpoint
CREATE INDEX `transaction_item_idx` ON `transactions` (`item_id`);--> statement-breakpoint
CREATE INDEX `transaction_troop_idx` ON `transactions` (`troop_id`);--> statement-breakpoint
CREATE INDEX `transaction_timestamp_idx` ON `transactions` (`timestamp`);--> statement-breakpoint
CREATE INDEX `transaction_action_idx` ON `transactions` (`action`);--> statement-breakpoint
CREATE UNIQUE INDEX `troops_slug_unique` ON `troops` (`slug`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `user_troop_email_idx` ON `users` (`troop_id`,`email`);