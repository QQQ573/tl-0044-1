import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ description: '仓库编码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '仓库名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '所在城市' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: '详细地址' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: '仓库管理员ID' })
  @IsString()
  @IsOptional()
  managerId?: string;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ description: '仓库名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '所在城市' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: '详细地址' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: '仓库管理员ID' })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
