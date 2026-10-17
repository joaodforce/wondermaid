ALTER TABLE "team_showcases" ADD COLUMN "good_json" jsonb;--> statement-breakpoint
ALTER TABLE "team_showcases" ADD COLUMN "calculation_json" jsonb;--> statement-breakpoint
ALTER TABLE "team_showcases" DROP COLUMN "noelle_json";--> statement-breakpoint
ALTER TABLE "team_showcases" DROP COLUMN "breakdown_json";