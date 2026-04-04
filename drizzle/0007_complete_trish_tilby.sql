CREATE TABLE `picture_reveal_games` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`mode` varchar(20) NOT NULL DEFAULT 'single',
	`start_score` int NOT NULL DEFAULT 1000,
	`open_tile_penalty` int NOT NULL DEFAULT 50,
	`special_tile_penalty` int NOT NULL DEFAULT 200,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `picture_reveal_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picture_reveal_images` (
	`id` varchar(255) NOT NULL,
	`game_id` varchar(255) NOT NULL,
	`image_path` varchar(500) NOT NULL,
	`rows` int NOT NULL DEFAULT 4,
	`cols` int NOT NULL DEFAULT 4,
	`special_tile_count` int NOT NULL DEFAULT 0,
	`special_pattern` varchar(40) NOT NULL DEFAULT 'plus',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `picture_reveal_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picture_reveal_image_choices` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`is_correct` tinyint NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `picture_reveal_image_choices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picture_reveal_play_sessions` (
	`id` varchar(255) NOT NULL,
	`game_id` varchar(255) NOT NULL,
	`player_token_hash` varchar(255) NOT NULL,
	`mode_snapshot` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`current_round_index` int NOT NULL DEFAULT 0,
	`current_score` int NOT NULL,
	`final_score` int,
	`game_snapshot` json NOT NULL,
	`image_queue` json NOT NULL,
	`completed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `picture_reveal_play_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picture_reveal_play_rounds` (
	`id` varchar(255) NOT NULL,
	`session_id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`round_index` int NOT NULL,
	`outcome` varchar(20) NOT NULL DEFAULT 'pending',
	`guessed_choice_id` varchar(255),
	`opened_tile_count` int NOT NULL DEFAULT 0,
	`auto_opened_tile_count` int NOT NULL DEFAULT 0,
	`special_hit_count` int NOT NULL DEFAULT 0,
	`round_score` int,
	`session_score_before` int NOT NULL,
	`session_score_after` int NOT NULL,
	`image_snapshot` json NOT NULL,
	`choice_snapshot` json NOT NULL,
	`shuffled_choice_order` json NOT NULL,
	`special_tile_numbers` json NOT NULL,
	`opened_tile_numbers` json NOT NULL,
	`completed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `picture_reveal_play_rounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `picture_reveal_games` ADD CONSTRAINT `prg_user_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picture_reveal_images` ADD CONSTRAINT `pri_game_fk` FOREIGN KEY (`game_id`) REFERENCES `picture_reveal_games`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picture_reveal_image_choices` ADD CONSTRAINT `pric_image_fk` FOREIGN KEY (`image_id`) REFERENCES `picture_reveal_images`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picture_reveal_play_sessions` ADD CONSTRAINT `prs_game_fk` FOREIGN KEY (`game_id`) REFERENCES `picture_reveal_games`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picture_reveal_play_rounds` ADD CONSTRAINT `prr_session_fk` FOREIGN KEY (`session_id`) REFERENCES `picture_reveal_play_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picture_reveal_play_rounds` ADD CONSTRAINT `prr_image_fk` FOREIGN KEY (`image_id`) REFERENCES `picture_reveal_images`(`id`) ON DELETE no action ON UPDATE no action;