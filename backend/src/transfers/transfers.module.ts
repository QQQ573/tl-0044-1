import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from './entities/transfer.entity';
import { TransferItem } from './entities/transfer-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, TransferItem])],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
