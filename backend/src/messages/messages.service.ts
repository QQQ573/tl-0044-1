import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { Message, MessageType, MessageChannel } from './entities/message.entity';
import { CreateMessageDto, QueryMessageDto, BatchMarkReadDto } from './dto/message.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';

export const MESSAGE_CREATED_EVENT = 'message.created';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateMessageDto): Promise<Message> {
    const message = this.messagesRepository.create(dto);
    const saved = await this.messagesRepository.save(message);

    this.eventEmitter.emit(MESSAGE_CREATED_EVENT, saved);
    await this.redis.publish(
      `messages:user:${dto.recipientId}`,
      JSON.stringify(saved),
    );

    return saved;
  }

  async findByRecipient(
    recipientId: string,
    query: QueryMessageDto,
    page = 1,
    limit = 20,
  ): Promise<{ data: Message[]; total: number; unreadCount: number }> {
    const where: any = { recipientId };
    if (query.read !== undefined) where.read = query.read;
    if (query.type) where.type = query.type;

    const [data, total] = await this.messagesRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.messagesRepository.count({
      where: { recipientId, read: false },
    });

    return { data, total, unreadCount };
  }

  async getUnreadCount(recipientId: string): Promise<{ count: number }> {
    const count = await this.messagesRepository.count({
      where: { recipientId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, recipientId: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id, recipientId },
    });
    if (!message) {
      throw new Error('消息不存在');
    }
    message.read = true;
    message.readAt = new Date();
    return this.messagesRepository.save(message);
  }

  async markAllAsRead(recipientId: string): Promise<{ affected: number }> {
    const result = await this.messagesRepository.update(
      { recipientId, read: false },
      { read: true, readAt: new Date() },
    );
    return { affected: result.affected || 0 };
  }

  async batchMarkAsRead(dto: BatchMarkReadDto, recipientId: string): Promise<{ affected: number }> {
    const result = await this.messagesRepository.update(
      { id: In(dto.ids), recipientId, read: false },
      { read: true, readAt: new Date() },
    );
    return { affected: result.affected || 0 };
  }

  async sendTransferNotification(
    type: MessageType,
    recipientRoles: UserRole[],
    title: string,
    content: string,
    metaData?: Record<string, any>,
    transferId?: string,
    transferNo?: string,
  ): Promise<Message[]> {
    const users = await this.usersRepository.find({
      where: { role: In(recipientRoles), isActive: true },
    });

    const messages: Message[] = [];
    for (const user of users) {
      const message = await this.create({
        type,
        recipientId: user.id,
        title,
        content,
        metaData,
        channel: MessageChannel.IN_APP,
        transferId,
        transferNo,
      });
      messages.push(message);
    }

    return messages;
  }

  async sendTransferNotificationToUser(
    type: MessageType,
    userId: string,
    title: string,
    content: string,
    metaData?: Record<string, any>,
    transferId?: string,
    transferNo?: string,
  ): Promise<Message> {
    return this.create({
      type,
      recipientId: userId,
      title,
      content,
      metaData,
      channel: MessageChannel.IN_APP,
      transferId,
      transferNo,
    });
  }
}
