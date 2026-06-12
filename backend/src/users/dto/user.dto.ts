import { IsString, IsNotEmpty, IsEnum, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty()
  realName: string;

  @ApiProperty({ description: '角色', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: '真实姓名' })
  @IsString()
  @IsOptional()
  realName?: string;

  @ApiPropertyOptional({ description: '角色', enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsOptional()
  isActive?: boolean;
}
