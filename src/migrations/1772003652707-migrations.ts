import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772003652707 implements MigrationInterface {
    name = 'Migrations1772003652707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."stages_stage_type_enum" AS ENUM('ROUND_ROBIN_PLAYOFF', 'SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'FLEX')`);
        await queryRunner.query(`CREATE TYPE "public"."stages_status_enum" AS ENUM('DRAFT', 'READY', 'IN_PROGRESS', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "stages" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "name" character varying(256) NOT NULL, "stage_type" "public"."stages_stage_type_enum" NOT NULL, "status" "public"."stages_status_enum" NOT NULL DEFAULT 'DRAFT', "sort_order" integer NOT NULL DEFAULT '0', "config" jsonb, CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_487baf8d9629c785651b3f8b42" ON "stages" ("session_id") `);
        await queryRunner.query(`ALTER TABLE "matches" ADD "stage_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "bracket_type" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "group_name" character varying(50)`);
        await queryRunner.query(`CREATE INDEX "IDX_aee6fb84e73d1951686301eaf1" ON "matches" ("stage_id") `);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_aee6fb84e73d1951686301eaf18" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stages" ADD CONSTRAINT "FK_487baf8d9629c785651b3f8b424" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stages" DROP CONSTRAINT "FK_487baf8d9629c785651b3f8b424"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_aee6fb84e73d1951686301eaf18"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aee6fb84e73d1951686301eaf1"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "group_name"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "bracket_type"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "stage_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_487baf8d9629c785651b3f8b42"`);
        await queryRunner.query(`DROP TABLE "stages"`);
        await queryRunner.query(`DROP TYPE "public"."stages_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."stages_stage_type_enum"`);
    }

}
