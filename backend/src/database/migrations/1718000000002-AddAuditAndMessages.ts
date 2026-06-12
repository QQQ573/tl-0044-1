import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditAndMessages1718000000002 implements MigrationInterface {
  name = 'AddAuditAndMessages1718000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."message_type_enum" AS ENUM('transfer_submitted', 'transfer_approved', 'transfer_rejected', 'transfer_shipped', 'transfer_received', 'logistics_timeout', 'system');
      CREATE TYPE "public"."message_channel_enum" AS ENUM('in_app', 'push', 'email');
      CREATE TYPE "public"."audit_action_enum" AS ENUM('create', 'update', 'submit', 'approve', 'reject', 'ship', 'receive', 'delete', 'logistics_update', 'attachment_upload', 'attachment_delete');
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" "public"."audit_action_enum" NOT NULL,
        "transferId" uuid,
        "transferNo" character varying(50),
        "oldStatus" character varying(32),
        "newStatus" character varying(32),
        "userId" uuid,
        "userName" character varying(100),
        "userRole" character varying(50),
        "remark" text,
        "metaData" jsonb,
        "ipAddress" character varying(50),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."message_type_enum" NOT NULL DEFAULT 'system',
        "recipientId" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "content" text NOT NULL,
        "metaData" jsonb,
        "read" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "channel" "public"."message_channel_enum" NOT NULL DEFAULT 'in_app',
        "transferId" uuid,
        "transferNo" character varying(50),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_transfer_created" ON "audit_logs" ("transferId", "createdAt");
      CREATE INDEX "IDX_audit_logs_user_created" ON "audit_logs" ("userId", "createdAt");
      CREATE INDEX "IDX_messages_recipient_read_created" ON "messages" ("recipientId", "read", "createdAt");
      CREATE INDEX "IDX_messages_recipient_created" ON "messages" ("recipientId", "createdAt");
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_transfer" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE SET NULL;
      ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
      ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE;
      ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_transfer" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_transfer";
      ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_recipient";
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user";
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_transfer";
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_messages_recipient_created";
      DROP INDEX "IDX_messages_recipient_read_created";
      DROP INDEX "IDX_audit_logs_user_created";
      DROP INDEX "IDX_audit_logs_transfer_created";
    `);

    await queryRunner.query(`
      DROP TABLE "messages";
      DROP TABLE "audit_logs";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."audit_action_enum";
      DROP TYPE "public"."message_channel_enum";
      DROP TYPE "public"."message_type_enum";
    `);
  }
}
