import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedData1700000000001 implements MigrationInterface {
  name = 'SeedData1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = await bcrypt.hash('123456', 10);

    await queryRunner.query(`
      INSERT INTO "users" ("id", "username", "password", "realName", "role", "email") VALUES
      (uuid_generate_v4(), 'admin', '${hashedPassword}', '系统管理员', 'region_manager', 'admin@example.com'),
      (uuid_generate_v4(), 'manager1', '${hashedPassword}', '张经理', 'region_manager', 'manager1@example.com'),
      (uuid_generate_v4(), 'keeper1', '${hashedPassword}', '李仓管', 'warehouse_keeper', 'keeper1@example.com'),
      (uuid_generate_v4(), 'keeper2', '${hashedPassword}', '王仓管', 'warehouse_keeper', 'keeper2@example.com'),
      (uuid_generate_v4(), 'finance1', '${hashedPassword}', '赵财务', 'finance', 'finance1@example.com');
    `);

    const cities = [
      { code: 'WH-BJ', name: '北京仓', city: '北京' },
      { code: 'WH-SH', name: '上海仓', city: '上海' },
      { code: 'WH-GZ', name: '广州仓', city: '广州' },
      { code: 'WH-SZ', name: '深圳仓', city: '深圳' },
      { code: 'WH-HZ', name: '杭州仓', city: '杭州' },
      { code: 'WH-NJ', name: '南京仓', city: '南京' },
      { code: 'WH-WH', name: '武汉仓', city: '武汉' },
      { code: 'WH-CD', name: '成都仓', city: '成都' },
      { code: 'WH-XA', name: '西安仓', city: '西安' },
      { code: 'WH-CQ', name: '重庆仓', city: '重庆' },
      { code: 'WH-TJ', name: '天津仓', city: '天津' },
      { code: 'WH-SY', name: '沈阳仓', city: '沈阳' },
    ];

    for (const wh of cities) {
      await queryRunner.query(`
        INSERT INTO "warehouses" ("id", "code", "name", "city", "address") VALUES
        (uuid_generate_v4(), '${wh.code}', '${wh.name}', '${wh.city}', '${wh.city}市工业园区');
      `);
    }

    await queryRunner.query(`
      INSERT INTO "skus" ("id", "skuCode", "skuName", "brand", "model", "description") VALUES
      (uuid_generate_v4(), 'SKU-IP15PM-256', 'iPhone 15 Pro Max 256GB', 'Apple', 'A3108', '苹果iPhone 15 Pro Max 原色钛金属 256GB'),
      (uuid_generate_v4(), 'SKU-IP15P-128', 'iPhone 15 Pro 128GB', 'Apple', 'A3104', '苹果iPhone 15 Pro 黑色钛金属 128GB'),
      (uuid_generate_v4(), 'SKU-HW-M60P-512', '华为 Mate 60 Pro 512GB', '华为', 'BRA-AL00', '华为Mate 60 Pro 雅川青 512GB'),
      (uuid_generate_v4(), 'SKU-HW-M60-256', '华为 Mate 60 256GB', '华为', 'ALN-AL00', '华为Mate 60 雅丹黑 256GB'),
      (uuid_generate_v4(), 'SKU-XM-14U-256', '小米14 Ultra 256GB', '小米', '24030PN60C', '小米14 Ultra 黑色 256GB'),
      (uuid_generate_v4(), 'SKU-OP-FX6-256', 'OPPO Find X6 Pro 256GB', 'OPPO', 'PGEM10', 'OPPO Find X6 Pro 云墨黑 256GB');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "skus"`);
    await queryRunner.query(`DELETE FROM "warehouses"`);
    await queryRunner.query(`DELETE FROM "users"`);
  }
}
