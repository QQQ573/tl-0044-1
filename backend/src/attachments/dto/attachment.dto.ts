import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAttachmentDto {
  @ApiProperty({ description: '关联调拨申请ID' })
  @IsUUID()
  @IsOptional()
  transferId?: string;
}

export class AttachmentResponseDto {
  @ApiProperty({ description: '附件ID' })
  id: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '上传时间' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '下载链接（带签名）' })
  downloadUrl?: string;
}
