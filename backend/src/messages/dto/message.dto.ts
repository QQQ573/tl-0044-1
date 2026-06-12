import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, MessageChannel } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ description: '消息类型', enum: MessageType })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ description: '接收人ID' })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: '消息标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '扩展数据' })
  @IsObject()
  @IsOptional()
  metaData?: Record<string, any>;

  @ApiPropertyOptional({ description: '推送渠道', enum: MessageChannel, default: MessageChannel.IN_APP })
  @IsEnum(MessageChannel)
  @IsOptional()
  channel?: MessageChannel;

  @ApiPropertyOptional({ description: '关联调拨申请ID' })
  @IsUUID()
  @IsOptional()
  transferId?: string;

  @ApiPropertyOptional({ description: '关联调拨单号' })
  @IsString()
  @IsOptional()
  transferNo?: string;
}

export class QueryMessageDto {
  @ApiPropertyOptional({ description: '是否已读' })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional({ description: '消息类型', enum: MessageType })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}

export class BatchMarkReadDto {
  @ApiProperty({ description: '消息ID列表' })
  @IsUUID(undefined, { each: true })
  ids: string[];
}
