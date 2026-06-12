import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { TransfersService } from '../transfers/transfers.service';
import { MailService } from './mail.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);
  private readonly timeoutSeconds: number;

  constructor(
    private transfersService: TransfersService,
    private mailService: MailService,
    private configService: ConfigService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    this.timeoutSeconds = parseInt(
      this.configService.get('LOGISTICS_TIMEOUT_SECONDS', '3600'),
      10,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkLogisticsTimeout() {
    this.logger.log('Starting logistics timeout check...');

    try {
      const transfers = await this.transfersService.findInTransitWithTimeout(
        this.timeoutSeconds,
      );

      this.logger.log(`Found ${transfers.length} transfers with logistics timeout`);

      for (const transfer of transfers) {
        const alertKey = `alert:logistics_timeout:${transfer.id}`;
        const alreadyAlerted = await this.redis.get(alertKey);

        if (!alreadyAlerted) {
          this.logger.log(`Sending timeout alert for transfer ${transfer.transferNo}`);
          await this.mailService.sendTimeoutAlert(transfer);
          await this.redis.setex(alertKey, 3600, '1');
        }
      }
    } catch (error) {
      this.logger.error(`Logistics timeout check failed: ${error.message}`);
    }

    this.logger.log('Logistics timeout check completed');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupAlertCache() {
    this.logger.log('Cleaning up expired alert cache...');
  }
}
