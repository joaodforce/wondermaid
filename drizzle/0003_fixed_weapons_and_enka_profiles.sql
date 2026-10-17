CREATE TABLE "enka_profiles" (
	"uid" varchar(15) PRIMARY KEY NOT NULL,
	"response_json" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "weapon_id" integer DEFAULT 12510 NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "weapon_refinement" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "enka_profiles" ADD CONSTRAINT "enka_profiles_uid_players_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Teams in order of relevance
UPDATE "scenarios" SET "sort_order" = 0 WHERE "id" = 'lunar-crystallize';--> statement-breakpoint
UPDATE "scenarios" SET "sort_order" = 1 WHERE "id" = 'furina-hyper';--> statement-breakpoint
UPDATE "scenarios" SET "sort_order" = 2 WHERE "id" = 'plunge-xianyun';--> statement-breakpoint
UPDATE "scenarios" SET "sort_order" = 3 WHERE "id" = 'mono-geo-c6-gorou';--> statement-breakpoint
-- Mono Geo runs Zhongli for his shield's RES shred
UPDATE "scenarios" SET "description" = 'N4 with C6 Gorou, Zhongli and Geo Resonance', "team_config_json" = "team_config_json" || '{"zhongli":true}'::jsonb WHERE "id" = 'mono-geo-c6-gorou' AND NOT ("team_config_json" ? 'zhongli');
