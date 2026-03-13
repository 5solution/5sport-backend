import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772180032876 implements MigrationInterface {
    name = 'Migrations1772180032876'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_aee6fb84e73d1951686301eaf18"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "stage_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_aee6fb84e73d1951686301eaf18" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_aee6fb84e73d1951686301eaf18"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "stage_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_aee6fb84e73d1951686301eaf18" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
