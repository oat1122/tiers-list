ALTER TABLE `sound_guess_games` ADD `image_width` int DEFAULT 1600 NOT NULL;--> statement-breakpoint
ALTER TABLE `sound_guess_games` ADD `image_height` int DEFAULT 900 NOT NULL;--> statement-breakpoint
ALTER TABLE `sound_guess_sounds` ADD `image_path` varchar(500);--> statement-breakpoint
ALTER TABLE `sound_guess_sounds` ADD `audio_start_ms` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sound_guess_sounds` ADD `audio_end_ms` int;