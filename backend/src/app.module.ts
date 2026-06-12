import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SkusModule } from './skus/skus.module';
import { TransfersModule } from './transfers/transfers.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { LogisticsModule } from './logistics/logistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { MessagesModule } from './messages/messages.module';
import { MinioModule } from './common/minio/minio.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    ScheduleModule.forRoot(),
    MinioModule,
    RedisModule,
    AuthModule,
    UsersModule,
    WarehousesModule,
    SkusModule,
    TransfersModule,
    AttachmentsModule,
    LogisticsModule,
    NotificationsModule,
    AuditModule,
    MessagesModule,
  ],
})
export class AppModule {}
