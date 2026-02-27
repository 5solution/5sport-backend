import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772181665141 implements MigrationInterface {
    name = 'Migrations1772181665141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1_player1_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1_player1_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1_player2_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1_player2_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2_player1_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2_player1_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2_player2_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2_player2_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_005bae80cae05ace44e92843213" FOREIGN KEY ("team1_player1_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_322d3ff7c4fa3619cf7c4a6227a" FOREIGN KEY ("team1_player2_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_3999c8e59564183838015baf09e" FOREIGN KEY ("team2_player1_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_16da670127cb2ba889ac6e99f4d" FOREIGN KEY ("team2_player2_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_16da670127cb2ba889ac6e99f4d"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_3999c8e59564183838015baf09e"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_322d3ff7c4fa3619cf7c4a6227a"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_005bae80cae05ace44e92843213"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2_player2_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2_player2_id" character varying`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2_player1_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2_player1_id" character varying`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1_player2_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1_player2_id" character varying`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1_player1_id"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1_player1_id" character varying`);
    }

}
