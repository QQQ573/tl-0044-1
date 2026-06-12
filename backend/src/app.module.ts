import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SkusModule } from './skus/skus.module';
import { TransfersModule } from './transfers/transfers.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { LogisticsModule } from './logistics/logistics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AuthModule,
    UsersModule,
    WarehousesModule,
    SkusModule,
    TransfersModule,
    AttachmentsModule,
    LogisticsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
