import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772610710808 implements MigrationInterface {
    name = 'Migrations1772610710808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_sessions" RENAME COLUMN "match_type" TO "competition_format"`);
        await queryRunner.query(`ALTER TYPE "public"."event_sessions_match_type_enum" RENAME TO "event_sessions_competition_format_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "require_partner"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "competitionFormat"`);
        await queryRunner.query(`DROP TYPE "public"."events_competitionformat_enum"`);
        await queryRunner.query(`ALTER TABLE "event_participants" ADD "seed" integer`);
        await queryRunner.query(`ALTER TYPE "public"."event_participants_status_enum" RENAME TO "event_participants_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."event_participants_status_enum" AS ENUM('REGISTERED', 'FINDING_PARTNER', 'WAITING_PARTNER', 'PAIRED', 'CHECKED_IN', 'READY', 'PLAYING', 'ELIMINATED', 'WINNER', 'WITHDRAWN', 'DISQUALIFIED')`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" TYPE "public"."event_participants_status_enum" USING "status"::"text"::"public"."event_participants_status_enum"`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" SET DEFAULT 'PAIRED'`);
        await queryRunner.query(`DROP TYPE "public"."event_participants_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_participants_status_enum_old" AS ENUM('REGISTERED', 'CHECKED_IN', 'WITHDRAWN', 'DISQUALIFIED')`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" TYPE "public"."event_participants_status_enum_old" USING "status"::"text"::"public"."event_participants_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "event_participants" ALTER COLUMN "status" SET DEFAULT 'REGISTERED'`);
        await queryRunner.query(`DROP TYPE "public"."event_participants_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."event_participants_status_enum_old" RENAME TO "event_participants_status_enum"`);
        await queryRunner.query(`ALTER TABLE "event_participants" DROP COLUMN "seed"`);
        await queryRunner.query(`CREATE TYPE "public"."events_competitionformat_enum" AS ENUM('SINGLES', 'DOUBLES')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "competitionFormat" "public"."events_competitionformat_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "require_partner" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."event_sessions_competition_format_enum" RENAME TO "event_sessions_match_type_enum"`);
        await queryRunner.query(`ALTER TABLE "event_sessions" RENAME COLUMN "competition_format" TO "match_type"`);
    }

}
