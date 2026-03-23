import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1774241054535 implements MigrationInterface {
    name = 'Migrations1774241054535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_de43fd6bdc28143d118c5ff0a38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de43fd6bdc28143d118c5ff0a3"`);
        await queryRunner.query(`CREATE TYPE "public"."event_orders_paymentstatus_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "event_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventId" uuid NOT NULL, "userId" character varying, "orderCode" character varying(40) NOT NULL, "contactName" character varying NOT NULL, "contactEmail" character varying NOT NULL, "contactPhone" character varying NOT NULL, "athletes" jsonb NOT NULL, "paymentMethod" character varying, "paymentStatus" "public"."event_orders_paymentstatus_enum" NOT NULL DEFAULT 'PENDING', "totalAmount" numeric(15,0) NOT NULL DEFAULT '0', "discountCode" character varying, "discountAmount" numeric(15,0) NOT NULL DEFAULT '0', "finalAmount" numeric(15,0) NOT NULL DEFAULT '0', "paymentProvider" character varying, "providerTransactionId" character varying, "paidAt" TIMESTAMP, "paymentMetadata" jsonb, "orderDate" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_037204dcf4e45b4476032374254" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_89e00a1fa89db18dd6123a8e02" ON "event_orders" ("orderCode") `);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "court_id"`);
        await queryRunner.query(`ALTER TYPE "public"."matches_status_enum" RENAME TO "matches_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matches_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" TYPE "public"."matches_status_enum" USING "status"::"text"::"public"."matches_status_enum"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`DROP TYPE "public"."matches_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "event_orders" ADD CONSTRAINT "FK_712998d7c2d119550324a250b9c" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_orders" DROP CONSTRAINT "FK_712998d7c2d119550324a250b9c"`);
        await queryRunner.query(`CREATE TYPE "public"."matches_status_enum_old" AS ENUM('PENDING', 'SCHEDULED', 'WARM_UP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" TYPE "public"."matches_status_enum_old" USING "status"::"text"::"public"."matches_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`DROP TYPE "public"."matches_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matches_status_enum_old" RENAME TO "matches_status_enum"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "court_id" uuid`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "priority" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89e00a1fa89db18dd6123a8e02"`);
        await queryRunner.query(`DROP TABLE "event_orders"`);
        await queryRunner.query(`DROP TYPE "public"."event_orders_paymentstatus_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_de43fd6bdc28143d118c5ff0a3" ON "matches" ("court_id") `);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_de43fd6bdc28143d118c5ff0a38" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
