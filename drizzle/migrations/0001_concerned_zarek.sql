CREATE TABLE `backup_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`interval` enum('weekly','monthly','quarterly') NOT NULL DEFAULT 'monthly',
	`lastBackupAt` timestamp,
	`nextBackupAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_settings_id` PRIMARY KEY(`id`)
);
