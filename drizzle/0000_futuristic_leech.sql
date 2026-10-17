CREATE TABLE "leaderboard_ranks" (
	"uid" varchar(15) NOT NULL,
	"scenario_id" varchar(50) NOT NULL,
	"build_id" varchar(36) NOT NULL,
	"final_damage" real NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_ranks_uid_scenario_id_pk" PRIMARY KEY("uid","scenario_id")
);
--> statement-breakpoint
CREATE TABLE "noelle_builds" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"uid" varchar(15) NOT NULL,
	"weapon_id" integer NOT NULL,
	"weapon_refinement" integer NOT NULL,
	"artifact_set_ids" jsonb NOT NULL,
	"stats_json" jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"uid" varchar(15) PRIMARY KEY NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"profile_picture_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"attack_type" varchar(20) NOT NULL,
	"team_config_json" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leaderboard_ranks" ADD CONSTRAINT "leaderboard_ranks_uid_players_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_ranks" ADD CONSTRAINT "leaderboard_ranks_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_ranks" ADD CONSTRAINT "leaderboard_ranks_build_id_noelle_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."noelle_builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "noelle_builds" ADD CONSTRAINT "noelle_builds_uid_players_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE cascade ON UPDATE no action;