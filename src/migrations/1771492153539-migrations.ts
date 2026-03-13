import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1771492153539 implements MigrationInterface {
    name = 'Migrations1771492153539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wards" ("code" integer NOT NULL, "name" character varying(100) NOT NULL, "division_type" character varying(50) NOT NULL, "codename" character varying(100) NOT NULL, "province_code" integer NOT NULL, CONSTRAINT "PK_24f16d2207b1dcb6ce07d81d20f" PRIMARY KEY ("code"))`);
        await queryRunner.query(`CREATE TABLE "provinces" ("code" integer NOT NULL, "name" character varying(100) NOT NULL, "division_type" character varying(50) NOT NULL, "codename" character varying(100) NOT NULL, "phone_code" integer NOT NULL, CONSTRAINT "PK_f4b684af62d5cb3aa174f6b9b8a" PRIMARY KEY ("code"))`);
        await queryRunner.query(`ALTER TABLE "wards" ADD CONSTRAINT "FK_6c3a8d384c72ec02bd6dc0ebfef" FOREIGN KEY ("province_code") REFERENCES "provinces"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wards" DROP CONSTRAINT "FK_6c3a8d384c72ec02bd6dc0ebfef"`);
        await queryRunner.query(`DROP TABLE "provinces"`);
        await queryRunner.query(`DROP TABLE "wards"`);
    }

}
