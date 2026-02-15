import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * EXAMPLE MIGRATION - Reference implementation
 * 
 * This file shows the complete SQL structure for all new tables.
 * DO NOT run this directly - use TypeORM's migration:generate instead.
 * 
 * To generate actual migration:
 * npm run typeorm migration:generate -- src/migrations/CreateAthleteLeaderboardMatch
 */
export class ExampleCreateAllTables1234567890 implements MigrationInterface {
  name = 'ExampleCreateAllTables1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "match_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "participant_status_enum" AS ENUM('REGISTERED', 'CHECKED_IN', 'WITHDRAWN', 'DISQUALIFIED')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "leaderboard_type_enum" AS ENUM('OVERALL', 'EVENT', 'MONTHLY', 'YEARLY')
    `);

    // ============================
    // 1. ATHLETES TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "athletes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" character varying(256) NOT NULL,
        "sport_type" "sport_type_enum" NOT NULL,
        "date_of_birth" date,
        "gender" character varying(20),
        "bio" text,
        "profile_image_url" text,
        "phone_number" character varying(20),
        "city" character varying(256),
        "country" character varying(256),
        "current_rating" numeric(5,2) NOT NULL DEFAULT '0',
        "peak_rating" numeric(5,2) NOT NULL DEFAULT '0',
        "rating_source" character varying(50),
        "total_events" integer NOT NULL DEFAULT '0',
        "total_matches" integer NOT NULL DEFAULT '0',
        "wins" integer NOT NULL DEFAULT '0',
        "losses" integer NOT NULL DEFAULT '0',
        "win_rate" numeric(5,2) NOT NULL DEFAULT '0',
        "achievements" text,
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_athletes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_athletes_user_sport" UNIQUE ("user_id", "sport_type")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athletes_user_id" ON "athletes" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athletes_sport_type" ON "athletes" ("sport_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athletes_current_rating" ON "athletes" ("current_rating")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athletes_is_active" ON "athletes" ("is_active")
    `);

    await queryRunner.query(`
      ALTER TABLE "athletes" 
      ADD CONSTRAINT "FK_athletes_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // ============================
    // 2. ATHLETE_STATS TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "athlete_stats" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "athlete_id" uuid NOT NULL,
        "date" date NOT NULL,
        "rating" numeric(5,2) NOT NULL,
        "matches_played" integer NOT NULL DEFAULT '0',
        "wins" integer NOT NULL DEFAULT '0',
        "losses" integer NOT NULL DEFAULT '0',
        "events_participated" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_athlete_stats" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_athlete_stats_athlete_date" UNIQUE ("athlete_id", "date")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athlete_stats_athlete_id" ON "athlete_stats" ("athlete_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_athlete_stats_date" ON "athlete_stats" ("date")
    `);

    await queryRunner.query(`
      ALTER TABLE "athlete_stats" 
      ADD CONSTRAINT "FK_athlete_stats_athlete" 
      FOREIGN KEY ("athlete_id") 
      REFERENCES "athletes"("id") 
      ON DELETE CASCADE
    `);

    // ============================
    // 3. LEADERBOARDS TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "leaderboards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(256) NOT NULL,
        "type" "leaderboard_type_enum" NOT NULL,
        "sport_type" "sport_type_enum" NOT NULL,
        "period" date,
        "event_id" uuid,
        "start_date" date NOT NULL,
        "end_date" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_leaderboards" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboards_sport_type_type_period" 
      ON "leaderboards" ("sport_type", "type", "period")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboards_type" ON "leaderboards" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboards_sport_type" ON "leaderboards" ("sport_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboards_event_id" ON "leaderboards" ("event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboards_is_active" ON "leaderboards" ("is_active")
    `);

    // ============================
    // 4. LEADERBOARD_ENTRIES TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "leaderboard_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "leaderboard_id" uuid NOT NULL,
        "athlete_id" uuid NOT NULL,
        "rank" integer NOT NULL,
        "previous_rank" integer,
        "score" numeric(10,2) NOT NULL,
        "matches_played" integer NOT NULL DEFAULT '0',
        "wins" integer NOT NULL DEFAULT '0',
        "losses" integer NOT NULL DEFAULT '0',
        "win_rate" numeric(5,2) NOT NULL DEFAULT '0',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_leaderboard_entries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leaderboard_entries_leaderboard_athlete" UNIQUE ("leaderboard_id", "athlete_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboard_entries_leaderboard_id" ON "leaderboard_entries" ("leaderboard_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboard_entries_athlete_id" ON "leaderboard_entries" ("athlete_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leaderboard_entries_rank" ON "leaderboard_entries" ("leaderboard_id", "rank")
    `);

    await queryRunner.query(`
      ALTER TABLE "leaderboard_entries" 
      ADD CONSTRAINT "FK_leaderboard_entries_leaderboard" 
      FOREIGN KEY ("leaderboard_id") 
      REFERENCES "leaderboards"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "leaderboard_entries" 
      ADD CONSTRAINT "FK_leaderboard_entries_athlete" 
      FOREIGN KEY ("athlete_id") 
      REFERENCES "athletes"("id") 
      ON DELETE CASCADE
    `);

    // ============================
    // 5. MATCHES TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "name" character varying(256) NOT NULL,
        "match_number" integer,
        "round" character varying(50),
        "court_number" integer,
        "scheduled_time" TIMESTAMP NOT NULL,
        "start_time" TIMESTAMP,
        "end_time" TIMESTAMP,
        "status" "match_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "team1_player1_id" uuid,
        "team1_player2_id" uuid,
        "team2_player1_id" uuid,
        "team2_player2_id" uuid,
        "team1_name" character varying(256),
        "team2_name" character varying(256),
        "team1_score" jsonb,
        "team2_score" jsonb,
        "winner_team" integer,
        "notes" text,
        "is_bye" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_matches" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_matches_session_id" ON "matches" ("session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_matches_scheduled_time" ON "matches" ("scheduled_time")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_matches_status" ON "matches" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "matches" 
      ADD CONSTRAINT "FK_matches_session" 
      FOREIGN KEY ("session_id") 
      REFERENCES "event_sessions"("id") 
      ON DELETE CASCADE
    `);

    // ============================
    // 6. MATCH_SCORES TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "match_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "match_id" uuid NOT NULL,
        "set_number" integer NOT NULL,
        "team1_points" integer NOT NULL,
        "team2_points" integer NOT NULL,
        "winner_team" integer,
        "details" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_match_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_match_scores_match_set" UNIQUE ("match_id", "set_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_match_scores_match_id" ON "match_scores" ("match_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "match_scores" 
      ADD CONSTRAINT "FK_match_scores_match" 
      FOREIGN KEY ("match_id") 
      REFERENCES "matches"("id") 
      ON DELETE CASCADE
    `);

    // ============================
    // 7. EVENT_PARTICIPANTS TABLE
    // ============================
    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "session_id" uuid,
        "athlete_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "partner_id" uuid,
        "ticket_code" character varying(20) NOT NULL,
        "registration_date" TIMESTAMP NOT NULL,
        "checkin_date" TIMESTAMP,
        "status" "participant_status_enum" NOT NULL DEFAULT 'REGISTERED',
        "bib_number" character varying,
        "custom_data" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_event_participants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_participants_event_athlete" UNIQUE ("event_id", "athlete_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_event_id" ON "event_participants" ("event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_session_id" ON "event_participants" ("session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_athlete_id" ON "event_participants" ("athlete_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_user_id" ON "event_participants" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_ticket_code" ON "event_participants" ("ticket_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_participants_status" ON "event_participants" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participants" 
      ADD CONSTRAINT "FK_event_participants_event" 
      FOREIGN KEY ("event_id") 
      REFERENCES "events"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participants" 
      ADD CONSTRAINT "FK_event_participants_session" 
      FOREIGN KEY ("session_id") 
      REFERENCES "event_sessions"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participants" 
      ADD CONSTRAINT "FK_event_participants_athlete" 
      FOREIGN KEY ("athlete_id") 
      REFERENCES "athletes"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participants" 
      ADD CONSTRAINT "FK_event_participants_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participants" 
      ADD CONSTRAINT "FK_event_participants_partner" 
      FOREIGN KEY ("partner_id") 
      REFERENCES "athletes"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`DROP TABLE "match_scores"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "leaderboard_entries"`);
    await queryRunner.query(`DROP TABLE "leaderboards"`);
    await queryRunner.query(`DROP TABLE "athlete_stats"`);
    await queryRunner.query(`DROP TABLE "athletes"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "match_status_enum"`);
    await queryRunner.query(`DROP TYPE "participant_status_enum"`);
    await queryRunner.query(`DROP TYPE "leaderboard_type_enum"`);
  }
}
