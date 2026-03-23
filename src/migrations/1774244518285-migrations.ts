import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1774244518285 implements MigrationInterface {
    name = 'Migrations1774244518285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_category_enum" AS ENUM('GENERAL', 'EVENT', 'PAYMENT', 'UI_UX', 'BUG', 'SUGGESTION')`);
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_status_enum" AS ENUM('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')`);
        await queryRunner.query(`CREATE TABLE "feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "category" "public"."feedbacks_category_enum" NOT NULL DEFAULT 'GENERAL', "content" text NOT NULL, "rating" smallint, "status" "public"."feedbacks_status_enum" NOT NULL DEFAULT 'NEW', "adminNote" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_e9b6450d76be18b05b5f09d577b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_e9b6450d76be18b05b5f09d577b"`);
        await queryRunner.query(`DROP TABLE "feedbacks"`);
        await queryRunner.query(`DROP TYPE "public"."feedbacks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feedbacks_category_enum"`);
    }

}
