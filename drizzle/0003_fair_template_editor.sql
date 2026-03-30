ALTER TABLE `tier_lists` ADD `editor_config` json;--> statement-breakpoint
ALTER TABLE `tier_items` MODIFY COLUMN `tier` varchar(255) NOT NULL;
