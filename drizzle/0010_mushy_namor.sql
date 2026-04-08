ALTER TABLE `picture_reveal_images` ADD `answer` varchar(255);--> statement-breakpoint
UPDATE `picture_reveal_images` AS `image`
INNER JOIN `picture_reveal_image_choices` AS `choice`
  ON `choice`.`image_id` = `image`.`id`
  AND `choice`.`is_correct` = 1
  AND `choice`.`deleted_at` IS NULL
SET `image`.`answer` = `choice`.`label`
WHERE `image`.`answer` IS NULL;--> statement-breakpoint
ALTER TABLE `picture_reveal_images` MODIFY `answer` varchar(255) NOT NULL;--> statement-breakpoint
DROP TABLE `picture_reveal_play_rounds`;--> statement-breakpoint
DROP TABLE `picture_reveal_play_sessions`;--> statement-breakpoint
DROP TABLE `picture_reveal_image_choices`;
