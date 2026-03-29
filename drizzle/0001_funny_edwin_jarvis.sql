CREATE TABLE `tier_lists` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`is_public` tinyint NOT NULL DEFAULT 0,
	`is_template` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `tier_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tier_items` (
	`id` varchar(255) NOT NULL,
	`tier_list_id` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`tier` varchar(10) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`item_type` varchar(20) NOT NULL DEFAULT 'text',
	`image_path` varchar(500),
	`show_caption` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `tier_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `role` varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `tier_lists` ADD CONSTRAINT `tier_lists_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tier_items` ADD CONSTRAINT `tier_items_tier_list_id_tier_lists_id_fk` FOREIGN KEY (`tier_list_id`) REFERENCES `tier_lists`(`id`) ON DELETE cascade ON UPDATE no action;