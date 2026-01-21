CREATE TABLE `playbackHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbackHistory_id` PRIMARY KEY(`id`)
);
