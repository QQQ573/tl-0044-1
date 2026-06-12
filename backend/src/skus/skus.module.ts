import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkusService } from './skus.service';
import { SkusController } from './skus.controller';
import { Sku } from './entities/sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sku])],
  controllers: [SkusController],
  providers: [SkusService],
  exports: [SkusService],
})
export class SkusModule {}
