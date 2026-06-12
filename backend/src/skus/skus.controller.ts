import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkusService } from './skus.service';
import { CreateSkuDto, UpdateSkuDto } from './dto/sku.dto';
import { Sku } from './entities/sku.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('SKU管理')
@Controller('skus')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Post()
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '创建SKU' })
  create(@Body() createSkuDto: CreateSkuDto): Promise<Sku> {
    return this.skusService.create(createSkuDto);
  }

  @Get()
  @ApiOperation({ summary: '获取SKU列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'activeOnly', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('keyword') keyword?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<{ data: Sku[]; total: number }> {
    return this.skusService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      keyword,
      activeOnly !== 'false',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取SKU详情' })
  findOne(@Param('id') id: string): Promise<Sku> {
    return this.skusService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '更新SKU' })
  update(@Param('id') id: string, @Body() updateSkuDto: UpdateSkuDto): Promise<Sku> {
    return this.skusService.update(id, updateSkuDto);
  }

  @Delete(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '禁用SKU' })
  remove(@Param('id') id: string): Promise<void> {
    return this.skusService.remove(id);
  }
}
