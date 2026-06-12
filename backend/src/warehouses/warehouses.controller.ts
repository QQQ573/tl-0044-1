import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { Warehouse } from './entities/warehouse.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('仓库管理')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '创建仓库' })
  create(@Body() createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: '获取仓库列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'activeOnly', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<{ data: Warehouse[]; total: number }> {
    return this.warehousesService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      activeOnly !== 'false',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取仓库详情' })
  findOne(@Param('id') id: string): Promise<Warehouse> {
    return this.warehousesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '更新仓库' })
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '禁用仓库' })
  remove(@Param('id') id: string): Promise<void> {
    return this.warehousesService.remove(id);
  }
}
