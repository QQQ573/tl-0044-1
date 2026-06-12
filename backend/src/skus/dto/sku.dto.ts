import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkuDto {
  @ApiProperty({ description: 'SKU编码' })
  @IsString()
  @IsNotEmpty()
  skuCode: string;

  @ApiProperty({ description: 'SKU名称' })
  @IsString()
  @IsNotEmpty()
  skuName: string;

  @ApiProperty({ description: '品牌' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSkuDto {
  @ApiPropertyOptional({ description: 'SKU名称' })
  @IsString()
  @IsOptional()
  skuName?: string;

  @ApiPropertyOptional({ description: '品牌' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
