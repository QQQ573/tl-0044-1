import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private warehousesRepository: Repository<Warehouse>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const existing = await this.warehousesRepository.findOne({
      where: { code: createWarehouseDto.code },
    });
    if (existing) {
      throw new ConflictException('仓库编码已存在');
    }
    const warehouse = this.warehousesRepository.create(createWarehouseDto);
    return this.warehousesRepository.save(warehouse);
  }

  async findAll(page = 1, limit = 50, activeOnly = true): Promise<{ data: Warehouse[]; total: number }> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    const [data, total] = await this.warehousesRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehousesRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, updateWarehouseDto);
    return this.warehousesRepository.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    warehouse.isActive = false;
    await this.warehousesRepository.save(warehouse);
  }
}
