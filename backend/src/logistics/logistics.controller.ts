import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { CreateLogisticsTrackingDto, MockLogisticsTrackingDto } from './dto/logistics.dto';
import { LogisticsTracking } from './entities/logistics-tracking.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('物流轨迹')
@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('tracking')
  @Roles(UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '录入物流轨迹点' })
  create(@Body() createDto: CreateLogisticsTrackingDto): Promise<LogisticsTracking> {
    return this.logisticsService.create(createDto);
  }

  @Post('tracking/mock')
  @Roles(UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER)
  @ApiOperation({ summary: 'Mock生成物流轨迹（自动生成多个轨迹点）' })
  @HttpCode(HttpStatus.OK)
  generateMock(@Body() mockDto: MockLogisticsTrackingDto): Promise<LogisticsTracking[]> {
    return this.logisticsService.generateMockTrackings(mockDto);
  }

  @Get('transfer/:transferId')
  @ApiOperation({ summary: '获取调拨单的物流轨迹列表' })
  findByTransferId(@Param('transferId') transferId: string): Promise<LogisticsTracking[]> {
    return this.logisticsService.findByTransferId(transferId);
  }

  @Get('transfer/:transferId/latest')
  @ApiOperation({ summary: '获取调拨单的最新物流轨迹' })
  getLatest(@Param('transferId') transferId: string): Promise<LogisticsTracking | null> {
    return this.logisticsService.getLatestTracking(transferId);
  }
}
