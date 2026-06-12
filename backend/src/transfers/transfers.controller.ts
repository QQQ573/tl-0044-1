import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConflictResponse } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import {
  CreateTransferDto,
  UpdateTransferDto,
  ApproveTransferDto,
  ShipTransferDto,
  QueryTransferDto,
} from './dto/transfer.dto';
import { Transfer } from './entities/transfer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, TransferStatus } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('调拨申请')
@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: '创建调拨申请' })
  @ApiConflictResponse({ description: '同一SKU同一批次存在进行中的申请' })
  create(
    @Body() createTransferDto: CreateTransferDto,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.create(createTransferDto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取调拨申请列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query() query: QueryTransferDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Transfer[]; total: number }> {
    return this.transfersService.findAll(query, parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取调拨申请详情' })
  findOne(@Param('id') id: string): Promise<Transfer> {
    return this.transfersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新调拨申请（仅草稿状态）' })
  update(
    @Param('id') id: string,
    @Body() updateTransferDto: UpdateTransferDto,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.update(id, updateTransferDto, user);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交审核（草稿→待审核）' })
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.submitForApproval(id, user);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.REGION_MANAGER, UserRole.FINANCE)
  @ApiOperation({ summary: '审核调拨申请（乐观锁，传入version）' })
  @ApiConflictResponse({ description: '并发冲突，数据已被修改' })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveTransferDto,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.approve(id, approveDto, user);
  }

  @Post(':id/ship')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '确认出库（待出库→在途）' })
  ship(
    @Param('id') id: string,
    @Body() shipDto: ShipTransferDto,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.ship(id, shipDto, user);
  }

  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '确认入库（在途→已完成）' })
  receive(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Transfer> {
    return this.transfersService.receive(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除调拨申请（仅草稿或驳回状态）' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.transfersService.remove(id, user);
  }
}
