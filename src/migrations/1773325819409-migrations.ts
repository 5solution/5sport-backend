import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1773325819409 implements MigrationInterface {
    name = 'Migrations1773325819409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."courts_status_enum" AS ENUM('ACTIVE', 'MAINTENANCE')`);
        await queryRunner.query(`CREATE TABLE "courts" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "status" "public"."courts_status_enum" NOT NULL DEFAULT 'ACTIVE', "access_secret" character varying(64) NOT NULL, "is_ghost" boolean NOT NULL DEFAULT false, "allowed_session_ids" text, CONSTRAINT "PK_948a5d356c3083f3237ecbf9897" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_10bd53f0ca05254ed6fc335a98" ON "courts" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "matches" ADD "court_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "priority" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."payments_paymentmethod_enum" RENAME TO "payments_paymentmethod_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('VNPAY_QR', 'INTERNATIONAL_CARD', 'DOMESTIC_CARD', 'PAYX_QR', 'PAYX_DOMESTIC', 'SEPAY_BANK_TRANSFER')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "public"."payments_paymentmethod_enum" USING "paymentMethod"::"text"::"public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matches_status_enum" RENAME TO "matches_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matches_status_enum" AS ENUM('PENDING', 'SCHEDULED', 'WARM_UP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" TYPE "public"."matches_status_enum" USING "status"::"text"::"public"."matches_status_enum"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`DROP TYPE "public"."matches_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_de43fd6bdc28143d118c5ff0a3" ON "matches" ("court_id") `);
        await queryRunner.query(`ALTER TABLE "courts" ADD CONSTRAINT "FK_10bd53f0ca05254ed6fc335a987" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_de43fd6bdc28143d118c5ff0a38" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_de43fd6bdc28143d118c5ff0a38"`);
        await queryRunner.query(`ALTER TABLE "courts" DROP CONSTRAINT "FK_10bd53f0ca05254ed6fc335a987"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de43fd6bdc28143d118c5ff0a3"`);
        await queryRunner.query(`CREATE TYPE "public"."matches_status_enum_old" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" TYPE "public"."matches_status_enum_old" USING "status"::"text"::"public"."matches_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`DROP TYPE "public"."matches_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matches_status_enum_old" RENAME TO "matches_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum_old" AS ENUM('VNPAY_QR', 'INTERNATIONAL_CARD', 'DOMESTIC_CARD', 'PAYX_QR', 'PAYX_DOMESTIC')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "public"."payments_paymentmethod_enum_old" USING "paymentMethod"::"text"::"public"."payments_paymentmethod_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_paymentmethod_enum_old" RENAME TO "payments_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "court_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10bd53f0ca05254ed6fc335a98"`);
        await queryRunner.query(`DROP TABLE "courts"`);
        await queryRunner.query(`DROP TYPE "public"."courts_status_enum"`);
    }

}
