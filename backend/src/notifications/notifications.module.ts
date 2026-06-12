import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationScheduler } from './notification-scheduler.service';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TransfersModule],
  providers: [MailService, NotificationScheduler],
  exports: [MailService],
})
export class NotificationsModule {}
