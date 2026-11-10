CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`submitted_at` text NOT NULL,
	`corpus` text NOT NULL,
	`tokenization` text NOT NULL,
	`embeddings` text NOT NULL,
	`loss_function` text NOT NULL,
	`trained_model` text NOT NULL
);
