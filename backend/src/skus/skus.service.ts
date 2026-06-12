import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Sku } from './entities/sku.entity';
import { CreateSkuDto, UpdateSkuDto } from './dto/sku.dto';

@Injectable()
export class SkusService {
  constructor(
    @InjectRepository(Sku)
    private skusRepository: Repository<Sku>,
  ) {}

  async create(createSkuDto: CreateSkuDto): Promise<Sku> {
    const existing = await this.skusRepository.findOne({
      where: { skuCode: createSkuDto.skuCode },
    });
    if (existing) {
      throw new ConflictException('SKU编码已存在');
    }
    const sku = this.skusRepository.create(createSkuDto);
    return this.skusRepository.save(sku);
  }

  async findAll(
    page = 1,
    limit = 50,
    keyword?: string,
    activeOnly = true,
  ): Promise<{ data: Sku[]; total: number }> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    if (keyword) {
      where.skuName = ILike(`%${keyword}%`);
    }
    const [data, total] = await this.skusRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Sku> {
    const sku = await this.skusRepository.findOne({ where: { id } });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }
    return sku;
  }

  async update(id: string, updateSkuDto: UpdateSkuDto): Promise<Sku> {
    const sku = await this.findOne(id);
    Object.assign(sku, updateSkuDto);
    return this.skusRepository.save(sku);
  }

  async remove(id: string): Promise<void> {
    const sku = await this.findOne(id);
    sku.isActive = false;
    await this.skusRepository.save(sku);
  }
}
