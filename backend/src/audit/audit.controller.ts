import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('审计日志')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '获取审计日志列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query() query: QueryAuditLogDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: AuditLog[]; total: number }> {
    return this.auditService.findAll(query, parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get('transfer/:transferId')
  @ApiOperation({ summary: '获取调拨申请的审计日志' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByTransferId(
    @Param('transferId') transferId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: AuditLog[]; total: number }> {
    return this.auditService.findByTransferId(
      transferId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }
}
