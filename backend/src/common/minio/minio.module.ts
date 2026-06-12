import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MinioModule');
        const minioClient = new Minio.Client({
          endPoint: configService.get('MINIO_ENDPOINT', 'localhost'),
          port: parseInt(configService.get('MINIO_PORT', '9000'), 10),
          useSSL: false,
          accessKey: configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
          secretKey: configService.get('MINIO_SECRET_KEY', 'minioadmin123'),
        });

        const bucket = configService.get('MINIO_BUCKET', 'wms-attachments');
        const bucketExists = await minioClient.bucketExists(bucket);
        if (!bucketExists) {
          await minioClient.makeBucket(bucket, 'us-east-1');
          logger.log(`Bucket '${bucket}' created`);
        } else {
          logger.log(`Bucket '${bucket}' already exists`);
        }

        return minioClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: [MINIO_CLIENT],
})
export class MinioModule implements OnModuleInit {
  onModuleInit() {
    const logger = new Logger('MinioModule');
    logger.log('MinioModule initialized');
  }
}
