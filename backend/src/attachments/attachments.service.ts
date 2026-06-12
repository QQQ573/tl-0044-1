import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from './entities/attachment.entity';
import { AttachmentResponseDto } from './dto/attachment.dto';
import { MINIO_CLIENT } from '../common/minio/minio.module';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AttachmentsService {
  private readonly bucketName: string;
  private readonly expires: number;

  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
    private configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('MINIO_BUCKET', 'wms-attachments');
    this.expires = parseInt(this.configService.get('MINIO_EXPIRES', '3600'), 10);
  }

  async upload(
    file: Express.Multer.File,
    transferId: string | undefined,
    user: User,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    const objectKey = `${Date.now()}-${uuidv4()}-${file.originalname}`;

    await this.minioClient.putObject(
      this.bucketName,
      objectKey,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'Original-Name': encodeURIComponent(file.originalname),
      },
    );

    const attachment = this.attachmentsRepository.create({
      fileName: objectKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucketName: this.bucketName,
      objectKey,
      transferId,
      uploadedById: user.id,
    });

    const saved = await this.attachmentsRepository.save(attachment);
    const downloadUrl = await this.getPresignedDownloadUrl(saved);

    return {
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      createdAt: saved.createdAt,
      downloadUrl,
    };
  }

  async findByTransferId(transferId: string): Promise<AttachmentResponseDto[]> {
    const attachments = await this.attachmentsRepository.find({
      where: { transferId },
      order: { createdAt: 'DESC' },
    });

    const result: AttachmentResponseDto[] = [];
    for (const att of attachments) {
      const downloadUrl = await this.getPresignedDownloadUrl(att);
      result.push({
        id: att.id,
        originalName: att.originalName,
        mimeType: att.mimeType,
        size: att.size,
        createdAt: att.createdAt,
        downloadUrl,
      });
    }
    return result;
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async getPresignedDownloadUrl(attachment: Attachment): Promise<string> {
    return this.minioClient.presignedGetObject(
      attachment.bucketName,
      attachment.objectKey,
      this.expires,
      {
        'response-content-disposition': `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
      },
    );
  }

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const attachment = await this.findOne(id);
    const url = await this.getPresignedDownloadUrl(attachment);
    return { url };
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);
    try {
      await this.minioClient.removeObject(attachment.bucketName, attachment.objectKey);
    } catch (err) {
      console.error('Failed to remove object from MinIO:', err);
    }
    await this.attachmentsRepository.delete(id);
  }
}
