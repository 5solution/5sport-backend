import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772609988411 implements MigrationInterface {
    name = 'Migrations1772609988411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."events_competitionformat_enum" AS ENUM('SINGLES', 'DOUBLES')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "competitionFormat" "public"."events_competitionformat_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "competitionFormat"`);
        await queryRunner.query(`DROP TYPE "public"."events_competitionformat_enum"`);
    }

}
