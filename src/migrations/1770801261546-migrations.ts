import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770801261546 implements MigrationInterface {
    name = 'Migrations1770801261546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user', 'organizer')`);
        await queryRunner.query(`CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "tags" text NOT NULL DEFAULT '', "google_id" character varying, "display_name" character varying, "avatar_url" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_media_type_enum" AS ENUM('LOGO', 'WALLPAPER', 'EMAIL_IMAGE')`);
        await queryRunner.query(`CREATE TABLE "event_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "type" "public"."event_media_type_enum" NOT NULL, "url" text NOT NULL, "file_size" integer NOT NULL, "mime_type" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e5f0c8c1718c8c2026c15296af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_descriptions" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "title" character varying(256), "content" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_9543ffd894fc1141f1740269e37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_custom_fields_field_type_enum" AS ENUM('TEXT', 'PROVINCE', 'COUNTRY', 'SINGLE_SELECT', 'MULTI_SELECT', 'DATE', 'FILE_UPLOAD')`);
        await queryRunner.query(`CREATE TABLE "event_custom_fields" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "label" character varying(256) NOT NULL, "field_name" character varying(256) NOT NULL, "description" character varying(250), "field_type" "public"."event_custom_fields_field_type_enum" NOT NULL, "options" text, "allowed_file_types" text, "default_value" text, "attachment_url" text, "db_mapping" character varying(50), "is_required" boolean NOT NULL DEFAULT false, "is_visible" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_671a801b5b96ed536a79929d451" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_blacklist_type_enum" AS ENUM('EMAIL', 'PHONE')`);
        await queryRunner.query(`CREATE TABLE "event_blacklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "type" "public"."event_blacklist_type_enum" NOT NULL, "value" character varying(256) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9ffd898640d072e83e39e38030d" UNIQUE ("event_id", "type", "value"), CONSTRAINT "PK_0b49a66a00ad86ba3532b62a6e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."events_sporttype_enum" AS ENUM('PICKLEBALL', 'BADMINTON')`);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'LIVE', 'CLOSED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "events" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizer_id" uuid NOT NULL, "name" character varying(256) NOT NULL, "brand" character varying(256), "sportType" "public"."events_sporttype_enum" NOT NULL, "hotline" character varying(20) NOT NULL, "address" text NOT NULL, "province_code" character varying(10) NOT NULL, "ward_code" character varying(10) NOT NULL, "prefix_code" character varying(6) NOT NULL, "slug" character varying(512) NOT NULL, "allow_transfer" boolean NOT NULL DEFAULT true, "status" "public"."events_status_enum" NOT NULL DEFAULT 'DRAFT', "event_start_time" TIMESTAMP NOT NULL, "event_end_time" TIMESTAMP NOT NULL, "edit_info_open_time" TIMESTAMP NOT NULL, "edit_info_close_time" TIMESTAMP NOT NULL, "transfer_open_time" TIMESTAMP, "transfer_close_time" TIMESTAMP, "checkin_open_time" TIMESTAMP NOT NULL, "checkin_close_time" TIMESTAMP NOT NULL, "payment_methods" text NOT NULL, "scoring_config" jsonb, "banner_enabled" boolean NOT NULL DEFAULT false, "banner_image_url" text, "banner_cta_url" text, "terms_file_url" text, "conditions_file_url" text, CONSTRAINT "UQ_05bd884c03d3f424e2204bd14cd" UNIQUE ("slug"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_sessions_match_type_enum" AS ENUM('SINGLES', 'DOUBLES')`);
        await queryRunner.query(`CREATE TABLE "event_sessions" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "name" character varying(256) NOT NULL, "match_type" "public"."event_sessions_match_type_enum" NOT NULL, "require_partner" boolean NOT NULL DEFAULT false, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "ticket_code" character varying(3) NOT NULL, "ticket_image_url" text, "rating_check_enabled" boolean NOT NULL DEFAULT false, "rating_sources" text, "min_rating" numeric(5,2), "max_rating" numeric(5,2), "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_dbe18de390df26f2dffc4ef3356" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ticket_tiers" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "name" character varying(256) NOT NULL, "is_free" boolean NOT NULL DEFAULT false, "price" numeric(15,0), "total_quantity" integer NOT NULL, "min_per_order" integer NOT NULL DEFAULT '1', "max_per_order" integer NOT NULL, "is_visible" boolean NOT NULL DEFAULT true, "sale_start_time" TIMESTAMP NOT NULL, "sale_end_time" TIMESTAMP NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_917cfec124fa5e8ce04d1e7b865" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "event_media" ADD CONSTRAINT "FK_16a84aef47c794ac3d01f39830c" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_descriptions" ADD CONSTRAINT "FK_26f3052348c3e7ecfa8275a0c15" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_custom_fields" ADD CONSTRAINT "FK_5cfddad6bde40926260e8131dff" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_blacklist" ADD CONSTRAINT "FK_a0c6b6ebce79ab8a2769d3fa600" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_14c9ce53a2c2a1c781b8390123e" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_sessions" ADD CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_tiers" ADD CONSTRAINT "FK_27235c27ec7afc20a18b612fa11" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_tiers" DROP CONSTRAINT "FK_27235c27ec7afc20a18b612fa11"`);
        await queryRunner.query(`ALTER TABLE "event_sessions" DROP CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_14c9ce53a2c2a1c781b8390123e"`);
        await queryRunner.query(`ALTER TABLE "event_blacklist" DROP CONSTRAINT "FK_a0c6b6ebce79ab8a2769d3fa600"`);
        await queryRunner.query(`ALTER TABLE "event_custom_fields" DROP CONSTRAINT "FK_5cfddad6bde40926260e8131dff"`);
        await queryRunner.query(`ALTER TABLE "event_descriptions" DROP CONSTRAINT "FK_26f3052348c3e7ecfa8275a0c15"`);
        await queryRunner.query(`ALTER TABLE "event_media" DROP CONSTRAINT "FK_16a84aef47c794ac3d01f39830c"`);
        await queryRunner.query(`DROP TABLE "ticket_tiers"`);
        await queryRunner.query(`DROP TABLE "event_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."event_sessions_match_type_enum"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."events_sporttype_enum"`);
        await queryRunner.query(`DROP TABLE "event_blacklist"`);
        await queryRunner.query(`DROP TYPE "public"."event_blacklist_type_enum"`);
        await queryRunner.query(`DROP TABLE "event_custom_fields"`);
        await queryRunner.query(`DROP TYPE "public"."event_custom_fields_field_type_enum"`);
        await queryRunner.query(`DROP TABLE "event_descriptions"`);
        await queryRunner.query(`DROP TABLE "event_media"`);
        await queryRunner.query(`DROP TYPE "public"."event_media_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
