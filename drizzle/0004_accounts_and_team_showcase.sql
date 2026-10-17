CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(24) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "account_claims" (
	"user_id" uuid NOT NULL,
	"uid" varchar(15) NOT NULL,
	"code" varchar(12) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_claims_user_id_uid_pk" PRIMARY KEY("user_id","uid")
);
--> statement-breakpoint
CREATE TABLE "team_showcases" (
	"uid" varchar(15) PRIMARY KEY NOT NULL,
	"submitted_by" uuid,
	"noelle_json" jsonb NOT NULL,
	"party_json" jsonb NOT NULL,
	"final_damage" double precision NOT NULL,
	"breakdown_json" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_claims" ADD CONSTRAINT "account_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_showcases" ADD CONSTRAINT "team_showcases_uid_players_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_showcases" ADD CONSTRAINT "team_showcases_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_showcases_damage_idx" ON "team_showcases" USING btree ("final_damage" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;