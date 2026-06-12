import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '创建用户' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: User[]; total: number }> {
    return this.usersService.findAll(parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get(':id')
  @Roles(UserRole.REGION_MANAGER, UserRole.FINANCE)
  @ApiOperation({ summary: '获取用户详情' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.REGION_MANAGER)
  @ApiOperation({ summary: '删除用户（软删除）' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
