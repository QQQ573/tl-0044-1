import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('region_manager', 'warehouse_keeper', 'finance');
      CREATE TYPE "public"."transfer_status_enum" AS ENUM('draft', 'pending_approval', 'pending_shipment', 'in_transit', 'completed', 'rejected');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "realName" character varying NOT NULL,
        "role" "public"."user_role_enum" NOT NULL,
        "email" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "warehouses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "city" character varying NOT NULL,
        "address" character varying,
        "managerId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_92ed9003ac9206771d57558cb10" UNIQUE ("code"),
        CONSTRAINT "PK_62abb49161ba4fe160e6d2b4a81" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "skus" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "skuCode" character varying NOT NULL,
        "skuName" character varying NOT NULL,
        "brand" character varying NOT NULL,
        "model" character varying,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_94a71666c91e2a2f3e13a7d9d7f" UNIQUE ("skuCode"),
        CONSTRAINT "PK_62abb49161ba4fe160e6d2b4a82" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transferNo" character varying NOT NULL,
        "status" "public"."transfer_status_enum" NOT NULL DEFAULT 'draft',
        "sourceWarehouseId" uuid NOT NULL,
        "targetWarehouseId" uuid NOT NULL,
        "skuId" uuid NOT NULL,
        "batchNo" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "reason" text,
        "remark" text,
        "applicantId" uuid,
        "approverId" uuid,
        "approvedAt" TIMESTAMP,
        "rejectionReason" character varying,
        "shippedAt" TIMESTAMP,
        "receivedAt" TIMESTAMP,
        "logisticsCompany" text,
        "trackingNo" character varying,
        "version" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_transfers_transferNo" UNIQUE ("transferNo"),
        CONSTRAINT "PK_transfers_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "transfer_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transferId" uuid NOT NULL,
        "skuId" uuid NOT NULL,
        "batchNo" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transfer_items_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fileName" character varying NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "size" bigint NOT NULL,
        "bucketName" character varying NOT NULL,
        "objectKey" character varying NOT NULL,
        "transferId" uuid,
        "uploadedById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "logistics_tracking" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transferId" uuid NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "location" character varying NOT NULL,
        "latitude" character varying,
        "longitude" character varying,
        "status" text NOT NULL,
        "description" text,
        "operator" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_logistics_tracking_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transfers_sku_batch_status" ON "transfers" ("skuId", "batchNo", "status");
      CREATE INDEX "IDX_logistics_tracking_transfer_timestamp" ON "logistics_tracking" ("transferId", "timestamp");
    `);

    await queryRunner.query(`
      ALTER TABLE "transfers" ADD CONSTRAINT "FK_transfers_source_warehouse" FOREIGN KEY ("sourceWarehouseId") REFERENCES "warehouses"("id");
      ALTER TABLE "transfers" ADD CONSTRAINT "FK_transfers_target_warehouse" FOREIGN KEY ("targetWarehouseId") REFERENCES "warehouses"("id");
      ALTER TABLE "transfers" ADD CONSTRAINT "FK_transfers_applicant" FOREIGN KEY ("applicantId") REFERENCES "users"("id");
      ALTER TABLE "transfers" ADD CONSTRAINT "FK_transfers_approver" FOREIGN KEY ("approverId") REFERENCES "users"("id");
      ALTER TABLE "transfer_items" ADD CONSTRAINT "FK_transfer_items_transfer" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE CASCADE;
      ALTER TABLE "transfer_items" ADD CONSTRAINT "FK_transfer_items_sku" FOREIGN KEY ("skuId") REFERENCES "skus"("id");
      ALTER TABLE "attachments" ADD CONSTRAINT "FK_attachments_uploader" FOREIGN KEY ("uploadedById") REFERENCES "users"("id");
      ALTER TABLE "logistics_tracking" ADD CONSTRAINT "FK_logistics_tracking_transfer" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "logistics_tracking" DROP CONSTRAINT "FK_logistics_tracking_transfer";
      ALTER TABLE "attachments" DROP CONSTRAINT "FK_attachments_uploader";
      ALTER TABLE "transfer_items" DROP CONSTRAINT "FK_transfer_items_sku";
      ALTER TABLE "transfer_items" DROP CONSTRAINT "FK_transfer_items_transfer";
      ALTER TABLE "transfers" DROP CONSTRAINT "FK_transfers_approver";
      ALTER TABLE "transfers" DROP CONSTRAINT "FK_transfers_applicant";
      ALTER TABLE "transfers" DROP CONSTRAINT "FK_transfers_target_warehouse";
      ALTER TABLE "transfers" DROP CONSTRAINT "FK_transfers_source_warehouse";
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_logistics_tracking_transfer_timestamp";
      DROP INDEX "IDX_transfers_sku_batch_status";
    `);

    await queryRunner.query(`
      DROP TABLE "logistics_tracking";
      DROP TABLE "attachments";
      DROP TABLE "transfer_items";
      DROP TABLE "transfers";
      DROP TABLE "skus";
      DROP TABLE "warehouses";
      DROP TABLE "users";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."transfer_status_enum";
      DROP TYPE "public"."user_role_enum";
    `);
  }
}
