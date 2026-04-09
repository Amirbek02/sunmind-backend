import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneEntity } from '../database/entities/zone.entity';
import { DeviceEntity } from '../database/entities/device.entity';
import { CreateZoneDto } from './dto/create-zone.dto';

@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(ZoneEntity)
    private readonly zoneRepository: Repository<ZoneEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
  ) {}

  async findOrCreate(name: string, userId: number): Promise<ZoneEntity> {
    let zone = await this.zoneRepository.findOne({ where: { name, userId } });
    if (!zone) {
      zone = this.zoneRepository.create({ name, userId });
      zone = await this.zoneRepository.save(zone);
    }
    return zone;
  }

  async create(dto: CreateZoneDto, userId: number): Promise<ZoneEntity> {
    const exists = await this.zoneRepository.findOne({ where: { name: dto.name, userId } });
    if (exists) {
      throw new HttpException('Зона с таким именем уже существует', HttpStatus.CONFLICT);
    }
    const zone = this.zoneRepository.create({ ...dto, userId });
    return this.zoneRepository.save(zone);
  }

  async list(userId: number): Promise<ZoneEntity[]> {
    return this.zoneRepository.find({ where: { userId }, relations: ['devices'] });
  }

  async getDevices(zoneId: number, userId: number): Promise<DeviceEntity[]> {
    const zone = await this.zoneRepository.findOne({ where: { id: zoneId, userId }, relations: ['devices'] });
    if (!zone) {
      throw new HttpException('Зона не найдена', HttpStatus.NOT_FOUND);
    }
    return zone.devices || [];
  }
}
