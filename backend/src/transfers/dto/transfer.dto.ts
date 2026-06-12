import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferStatus } from '../../common/enums';

export class CreateTransferDto {
  @ApiProperty({ description: '调出仓库ID' })
  @IsUUID()
  @IsNotEmpty()
  sourceWarehouseId: string;

  @ApiProperty({ description: '调入仓库ID' })
  @IsUUID()
  @IsNotEmpty()
  targetWarehouseId: string;

  @ApiProperty({ description: 'SKU ID' })
  @IsUUID()
  @IsNotEmpty()
  skuId: string;

  @ApiProperty({ description: '批次号' })
  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @ApiProperty({ description: '调拨数量', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: '调拨原因' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '是否直接提交审核', default: false })
  @IsOptional()
  submitForApproval?: boolean;
}

export class UpdateTransferDto {
  @ApiPropertyOptional({ description: '调出仓库ID' })
  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: '调入仓库ID' })
  @IsUUID()
  @IsOptional()
  targetWarehouseId?: string;

  @ApiPropertyOptional({ description: 'SKU ID' })
  @IsUUID()
  @IsOptional()
  skuId?: string;

  @ApiPropertyOptional({ description: '批次号' })
  @IsString()
  @IsOptional()
  batchNo?: string;

  @ApiPropertyOptional({ description: '调拨数量', minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: '调拨原因' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class ApproveTransferDto {
  @ApiProperty({ description: '当前版本号（乐观锁）' })
  @IsInt()
  @IsNotEmpty()
  version: number;

  @ApiProperty({ description: '审核状态', enum: [TransferStatus.PENDING_SHIPMENT, TransferStatus.REJECTED] })
  @IsEnum([TransferStatus.PENDING_SHIPMENT, TransferStatus.REJECTED])
  decision: TransferStatus.PENDING_SHIPMENT | TransferStatus.REJECTED;

  @ApiPropertyOptional({ description: '驳回原因（驳回时必填）' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ShipTransferDto {
  @ApiProperty({ description: '物流公司' })
  @IsString()
  @IsNotEmpty()
  logisticsCompany: string;

  @ApiProperty({ description: '运单号' })
  @IsString()
  @IsNotEmpty()
  trackingNo: string;
}

export class QueryTransferDto {
  @ApiPropertyOptional({ description: '状态', enum: TransferStatus })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional({ description: '调出仓库ID' })
  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: '调入仓库ID' })
  @IsUUID()
  @IsOptional()
  targetWarehouseId?: string;

  @ApiPropertyOptional({ description: 'SKU ID' })
  @IsUUID()
  @IsOptional()
  skuId?: string;

  @ApiPropertyOptional({ description: '调拨单号' })
  @IsString()
  @IsOptional()
  transferNo?: string;

  @ApiPropertyOptional({ description: '申请人ID' })
  @IsUUID()
  @IsOptional()
  applicantId?: string;
}
