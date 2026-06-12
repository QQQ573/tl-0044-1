import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Sse,
  MessageEvent,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { fromEvent, interval, map, merge, Observable, filter } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagesService, MESSAGE_CREATED_EVENT } from './messages.service';
import { Message } from './entities/message.entity';
import { QueryMessageDto, BatchMarkReadDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('站内信')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的消息列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: User,
    @Query() query: QueryMessageDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Message[]; total: number; unreadCount: number }> {
    return this.messagesService.findByRecipient(
      user.id,
      query,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读消息数量' })
  getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记单条消息为已读' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Message> {
    return this.messagesService.markAsRead(id, user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: '标记所有消息为已读' })
  markAllAsRead(@CurrentUser() user: User): Promise<{ affected: number }> {
    return this.messagesService.markAllAsRead(user.id);
  }

  @Put('batch-read')
  @ApiOperation({ summary: '批量标记消息为已读' })
  batchMarkAsRead(
    @Body() dto: BatchMarkReadDto,
    @CurrentUser() user: User,
  ): Promise<{ affected: number }> {
    return this.messagesService.batchMarkAsRead(dto, user.id);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE 实时消息推送（30s 心跳）' })
  stream(@CurrentUser() user: User, @Request() req): Observable<MessageEvent> {
    req.on('close', () => {
      console.log(`SSE connection closed for user ${user.id}`);
    });

    const heartbeat$ = interval(30000).pipe(
      map(() => ({ type: 'heartbeat', data: { timestamp: Date.now() } })),
    );

    const message$ = fromEvent(this.eventEmitter, MESSAGE_CREATED_EVENT).pipe(
      map((message: any) => {
        if (message.recipientId === user.id) {
          return { type: 'message', data: message };
        }
        return null;
      }),
      filter((msg: any) => msg !== null),
    );

    return merge(heartbeat$, message$).pipe(
      map((data) => ({ data } as MessageEvent)),
    );
  }
}
