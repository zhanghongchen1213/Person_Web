DROP TABLE `comments`;--> statement-breakpoint
DROP TABLE `favorites`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `likeCount`;--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `favoriteCount`;--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `commentCount`;