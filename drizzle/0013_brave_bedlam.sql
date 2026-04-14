CREATE TABLE `sound_guess_games` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`cover_image_path` varchar(500),
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `sound_guess_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sound_guess_sounds` (
	`id` varchar(255) NOT NULL,
	`game_id` varchar(255) NOT NULL,
	`audio_path` varchar(500) NOT NULL,
	`answer` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `sound_guess_sounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sound_guess_games` ADD CONSTRAINT `sgg_user_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sound_guess_sounds` ADD CONSTRAINT `sgs_game_fk` FOREIGN KEY (`game_id`) REFERENCES `sound_guess_games`(`id`) ON DELETE cascade ON UPDATE no action;