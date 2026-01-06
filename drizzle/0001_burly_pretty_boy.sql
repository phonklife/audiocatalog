CREATE TABLE `audioTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`artist` varchar(255) NOT NULL,
	`album` varchar(255),
	`duration` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`genre` varchar(100),
	`description` text,
	`plays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audioTracks_id` PRIMARY KEY(`id`)
);
