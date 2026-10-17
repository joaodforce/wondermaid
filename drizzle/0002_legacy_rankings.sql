CREATE TABLE "legacy_rankings" (
	"uid" varchar(15) NOT NULL,
	"scenario_name" varchar(100) NOT NULL,
	"final_damage" double precision NOT NULL,
	"effective_atk" real,
	"recorded_at" timestamp NOT NULL,
	CONSTRAINT "legacy_rankings_uid_scenario_name_pk" PRIMARY KEY("uid","scenario_name")
);
--> statement-breakpoint
ALTER TABLE "legacy_rankings" ADD CONSTRAINT "legacy_rankings_uid_players_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE cascade ON UPDATE no action;