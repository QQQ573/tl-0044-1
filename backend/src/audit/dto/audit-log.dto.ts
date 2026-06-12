import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsIP } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ description: '操作类型', enum: AuditAction })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiPropertyOptional({ description: '调拨申请ID' })
  @IsUUID()
  @IsOptional()
  transferId?: string;

  @ApiPropertyOptional({ description: '调拨单号' })
  @IsString()
  @IsOptional()
  transferNo?: string;

  @ApiPropertyOptional({ description: '原状态' })
  @IsString()
  @IsOptional()
  oldStatus?: string;

  @ApiPropertyOptional({ description: '新状态' })
  @IsString()
  @IsOptional()
  newStatus?: string;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: '操作人姓名' })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiPropertyOptional({ description: '操作人角色' })
  @IsString()
  @IsOptional()
  userRole?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '扩展数据' })
  @IsObject()
  @IsOptional()
  metaData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP地址' })
  @IsIP()
  @IsOptional()
  ipAddress?: string;
}

export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: '调拨申请ID' })
  @IsUUID()
  @IsOptional()
  transferId?: string;

  @ApiPropertyOptional({ description: '操作类型' })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
