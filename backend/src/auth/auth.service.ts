import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      email: user.email,
    };
  }
}
