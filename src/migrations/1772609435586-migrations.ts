import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772609435586 implements MigrationInterface {
    name = 'Migrations1772609435586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "require_partner" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "require_partner"`);
    }

}
