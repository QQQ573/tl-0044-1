import { IsString, IsNotEmpty, IsOptional, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLogisticsTrackingDto {
  @ApiProperty({ description: '调拨申请ID' })
  @IsUUID()
  @IsNotEmpty()
  transferId: string;

  @ApiProperty({ description: '轨迹时间戳（ISO8601格式）' })
  @IsISO8601()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ description: '当前位置' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ description: '纬度' })
  @IsString()
  @IsOptional()
  latitude?: string;

  @ApiPropertyOptional({ description: '经度' })
  @IsString()
  @IsOptional()
  longitude?: string;

  @ApiProperty({ description: '物流状态', example: '已揽收/运输中/派送中/已签收' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: '描述信息' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '操作员' })
  @IsString()
  @IsOptional()
  operator?: string;
}

export class MockLogisticsTrackingDto {
  @ApiProperty({ description: '调拨申请ID' })
  @IsUUID()
  @IsNotEmpty()
  transferId: string;

  @ApiPropertyOptional({ description: '生成轨迹点数量，默认5个', default: 5 })
  @IsOptional()
  pointCount?: number;
}
