import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsTracking } from './entities/logistics-tracking.entity';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogisticsTracking]), TransfersModule],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
