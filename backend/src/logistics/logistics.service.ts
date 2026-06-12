import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogisticsTracking } from './entities/logistics-tracking.entity';
import { CreateLogisticsTrackingDto, MockLogisticsTrackingDto } from './dto/logistics.dto';
import { TransfersService } from '../transfers/transfers.service';
import { TransferStatus } from '../common/enums';

const MOCK_CITIES = [
  { city: '北京市', lat: '39.9042', lng: '116.4074' },
  { city: '济南市', lat: '36.6512', lng: '117.1201' },
  { city: '徐州市', lat: '34.2610', lng: '117.1845' },
  { city: '南京市', lat: '32.0603', lng: '118.7969' },
  { city: '上海市', lat: '31.2304', lng: '121.4737' },
  { city: '杭州市', lat: '30.2741', lng: '120.1551' },
  { city: '福州市', lat: '26.0745', lng: '119.2965' },
  { city: '广州市', lat: '23.1291', lng: '113.2644' },
  { city: '深圳市', lat: '22.5431', lng: '114.0579' },
];

const MOCK_STATUSES = [
  { status: '已揽收', desc: '快件已到达【{city}】分拨中心' },
  { status: '运输中', desc: '快件正在【{city}】发往【{nextCity}】途中' },
  { status: '到达中转站', desc: '快件已到达【{city}】中转站' },
  { status: '派送中', desc: '快件正在【{city}】进行派送' },
  { status: '已签收', desc: '快件已在【{city}】签收' },
];

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(LogisticsTracking)
    private logisticsTrackingRepository: Repository<LogisticsTracking>,
    private transfersService: TransfersService,
  ) {}

  async create(
    createDto: CreateLogisticsTrackingDto,
  ): Promise<LogisticsTracking> {
    const transfer = await this.transfersService.findOne(createDto.transferId);
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('只有在途状态的调拨单可以录入物流轨迹');
    }

    const tracking = this.logisticsTrackingRepository.create({
      ...createDto,
      timestamp: new Date(createDto.timestamp),
    });

    return this.logisticsTrackingRepository.save(tracking);
  }

  async findByTransferId(transferId: string): Promise<LogisticsTracking[]> {
    return this.logisticsTrackingRepository.find({
      where: { transferId },
      order: { timestamp: 'DESC' },
    });
  }

  async getLatestTracking(transferId: string): Promise<LogisticsTracking | null> {
    return this.logisticsTrackingRepository.findOne({
      where: { transferId },
      order: { timestamp: 'DESC' },
    });
  }

  async generateMockTrackings(
    mockDto: MockLogisticsTrackingDto,
  ): Promise<LogisticsTracking[]> {
    const transfer = await this.transfersService.findOne(mockDto.transferId);
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('只有在途状态的调拨单可以生成物流轨迹');
    }

    const pointCount = Math.min(Math.max(mockDto.pointCount || 5, 2), 8);
    const startIdx = Math.floor(Math.random() * (MOCK_CITIES.length - pointCount));
    const selectedCities = MOCK_CITIES.slice(startIdx, startIdx + pointCount);

    const now = new Date();
    const trackings: LogisticsTracking[] = [];
    const intervalMinutes = 60;

    for (let i = 0; i < selectedCities.length; i++) {
      const city = selectedCities[i];
      const statusTemplate = MOCK_STATUSES[Math.min(i, MOCK_STATUSES.length - 1)];
      const nextCity = selectedCities[i + 1] || city;
      const timestamp = new Date(now.getTime() - (selectedCities.length - 1 - i) * intervalMinutes * 60 * 1000);

      const tracking = this.logisticsTrackingRepository.create({
        transferId: mockDto.transferId,
        timestamp,
        location: city.city,
        latitude: city.lat,
        longitude: city.lng,
        status: statusTemplate.status,
        description: statusTemplate.desc
          .replace('{city}', city.city)
          .replace('{nextCity}', nextCity.city),
        operator: `快递员${Math.floor(Math.random() * 1000)}`,
      });

      trackings.push(await this.logisticsTrackingRepository.save(tracking));
    }

    return trackings;
  }
}
