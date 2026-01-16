ALTER TABLE `articles` ADD `type` enum('blog','doc') DEFAULT 'blog' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `type` enum('blog','doc') DEFAULT 'blog' NOT NULL;