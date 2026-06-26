CREATE TABLE `exercise_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trainingPlanId` int NOT NULL,
	`dailyChecklistId` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`dayNumber` int NOT NULL,
	`exerciseIndex` int NOT NULL,
	`plannedSets` int NOT NULL,
	`plannedReps` varchar(50) NOT NULL,
	`completedSets` int NOT NULL DEFAULT 0,
	`completedReps` varchar(50),
	`weight` int,
	`duration` int,
	`notes` text,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercise_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;