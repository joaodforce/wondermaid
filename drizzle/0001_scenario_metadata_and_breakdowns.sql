ALTER TABLE "leaderboard_ranks" ALTER COLUMN "final_damage" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "leaderboard_ranks" ADD COLUMN "breakdown_json" jsonb;--> statement-breakpoint
ALTER TABLE "noelle_builds" ADD COLUMN "constellation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "level" integer;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "leaderboard_ranks_scenario_damage_idx" ON "leaderboard_ranks" USING btree ("scenario_id","final_damage" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "noelle_builds_uid_idx" ON "noelle_builds" USING btree ("uid");--> statement-breakpoint
-- The first release seeded this scenario with the old flat team flags
UPDATE "scenarios" SET "name" = 'Mono Geo', "description" = 'N4 with C6 Gorou and Geo Resonance', "team_config_json" = '{"geoResonance":true,"gorou":{"constellation":6}}'::jsonb WHERE "id" = 'mono-geo-c6-gorou' AND "team_config_json" ? 'gorouC6';--> statement-breakpoint
-- Builds stored before stats_json held the parsed Enka build can't be recalculated; their ranks came from the old calculator
DELETE FROM "noelle_builds" WHERE NOT ("stats_json" ? 'stats');
