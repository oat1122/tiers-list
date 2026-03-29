ALTER TABLE `tier_lists` MODIFY COLUMN `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `tier_items` MODIFY COLUMN `deleted_at` datetime;