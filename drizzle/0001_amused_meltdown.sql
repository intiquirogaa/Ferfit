CREATE TABLE `daily_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trainingPlanId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`dayOfWeek` varchar(20) NOT NULL,
	`totalSeries` int NOT NULL,
	`completedSeries` int NOT NULL DEFAULT 0,
	`isCompleted` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('strength','hypertrophy') NOT NULL,
	`daysPerWeek` int NOT NULL,
	`durationWeeks` int NOT NULL DEFAULT 12,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`isActive` int NOT NULL DEFAULT 1,
	`generatedContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXP` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`streak` int NOT NULL DEFAULT 0,
	`seriesCompletedHistorically` int NOT NULL DEFAULT 0,
	`seriesProgrammed` int NOT NULL DEFAULT 0,
	`lastWorkoutDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_progress_userId_unique` UNIQUE(`userId`)
);
