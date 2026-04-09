import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DeviceEntity } from '../database/entities/device.entity';
import { DeviceScheduleEntity } from '../database/entities/device-schedule.entity';
import { DeviceTelemetryEntity } from '../database/entities/device-telemetry.entity';
import { DeviceDataDto } from './dto/device-data.dto';
import {
  DeviceScheduleDto,
  DeviceScheduleResponseDto,
  DeviceStatusResponseDto,
} from './dto/device-response.dto';
import {
  AnalyticsSummaryDto,
  DeviceTelemetryResponseDto,
} from './dto/device-telemetry.dto';
import { DeviceRegisterDto } from './dto/device-register.dto';
import { ZoneService } from '../zone/zone.service';
import { UserService } from '../user/user.service';
import { Inject, forwardRef } from '@nestjs/common';

const PERIOD_MAP = {
  day: 1,
  week: 7,
  month: 30,
} as const;

@Injectable()
export class DeviceService {
  private readonly defaultPowerWatts = Number(process.env.DEVICE_POWER_WATTS || 5);

  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(DeviceScheduleEntity)
    private readonly scheduleRepository: Repository<DeviceScheduleEntity>,
    @InjectRepository(DeviceTelemetryEntity)
    private readonly telemetryRepository: Repository<DeviceTelemetryEntity>,
    @Inject(forwardRef(() => ZoneService))
    private readonly zoneService: ZoneService,
    private readonly userService: UserService,
  ) {}

  async registerDevice(
    dto: DeviceRegisterDto,
    userId: number,
  ): Promise<DeviceStatusResponseDto> {
    // QR: SUNMIND:SMP-0001
    const deviceIdFromQr = dto.qr?.startsWith('SUNMIND:')
      ? dto.qr.split(':')[1]
      : undefined;

    const deviceId = dto.deviceId || deviceIdFromQr;
    if (!deviceId) {
      throw new HttpException('deviceId не указан', HttpStatus.BAD_REQUEST);
    }

    const device = await this.deviceRepository.findOne({ where: { deviceId } });
    if (!device) {
      throw new HttpException('Устройство не найдено', HttpStatus.NOT_FOUND);
    }

    if (!dto.zoneName?.trim()) {
      throw new HttpException('zoneName обязателен', HttpStatus.BAD_REQUEST);
    }

    // Уже привязано к другому пользователю
    if (device.userId && device.userId !== userId) {
      throw new HttpException('Устройство уже привязано к другому пользователю', HttpStatus.CONFLICT);
    }

    if (device.zoneId) {
      return {
        status: 'success',
        deviceId: device.deviceId,
        zone: { id: device.zoneId, name: dto.zoneName },
      } as any;
    }

    const zone = await this.zoneService.findOrCreate(dto.zoneName, userId);

    device.zoneId = zone.id;
    device.userId = device.userId ?? userId;
    await this.deviceRepository.save(device);

    return {
      status: 'success',
      deviceId: device.deviceId,
      zone: { id: zone.id, name: zone.name },
    } as any;
  }

  async saveTelemetry(dto: DeviceDataDto): Promise<DeviceStatusResponseDto> {
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();

    let device = await this.deviceRepository.findOne({
      where: { deviceId: dto.deviceId },
      relations: ['schedule'],
    });

    if (!device) {
      device = this.deviceRepository.create({ deviceId: dto.deviceId });
    }

    device.lux = dto.lux;
    device.motion = dto.motion;
    device.brightness = dto.brightness;
    device.batteryVoltage = dto.batteryVoltage ?? undefined;
    device.batteryPercent = dto.batteryPercent ?? undefined;
    device.manualMode = dto.manualMode;
    device.lastSeen = createdAt;

    await this.deviceRepository.save(device);

    const telemetry = this.telemetryRepository.create({
      deviceId: dto.deviceId,
      lux: dto.lux,
      motion: dto.motion,
      brightness: dto.brightness,
      batteryVoltage: dto.batteryVoltage ?? undefined,
      batteryPercent: dto.batteryPercent ?? undefined,
      manualMode: dto.manualMode,
      createdAt,
    });
    await this.telemetryRepository.save(telemetry);

    return this.mapStatus(device);
  }

  async getStatus(deviceId: string): Promise<DeviceStatusResponseDto> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      throw new HttpException('Устройство не найдено', HttpStatus.NOT_FOUND);
    }

    return this.mapStatus(device);
  }

  async getSchedule(deviceId: string): Promise<DeviceScheduleResponseDto> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      throw new HttpException('Устройство не найдено', HttpStatus.NOT_FOUND);
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { device: { deviceId } },
      relations: ['device'],
    });

    if (!schedule) {
      throw new HttpException('Расписание не найдено', HttpStatus.NOT_FOUND);
    }

    return this.mapSchedule(device.deviceId, schedule);
  }

  async setSchedule(
    deviceId: string,
    dto: DeviceScheduleDto,
  ): Promise<DeviceScheduleResponseDto> {
    let device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      device = await this.deviceRepository.save(
        this.deviceRepository.create({ deviceId }),
      );
    }

    let schedule = await this.scheduleRepository.findOne({
      where: { device: { deviceId: device.deviceId } },
      relations: ['device'],
    });

    if (!schedule) {
      schedule = this.scheduleRepository.create({ ...dto, device });
    } else {
      schedule.onHour = dto.onHour;
      schedule.onMinute = dto.onMinute;
      schedule.offHour = dto.offHour;
      schedule.offMinute = dto.offMinute;
    }

    const saved = await this.scheduleRepository.save(schedule);

    return this.mapSchedule(device.deviceId, saved);
  }

  async getTelemetry(
    deviceId: string,
    period: keyof typeof PERIOD_MAP,
  ): Promise<DeviceTelemetryResponseDto[]> {
    const { from, to } = this.resolvePeriod(period);

    const rows = await this.telemetryRepository.find({
      where: { deviceId, createdAt: Between(from, to) },
      order: { createdAt: 'ASC' },
    });

    return rows.map((row) => ({
      deviceId: row.deviceId,
      lux: row.lux ?? 0,
      motion: row.motion,
      brightness: row.brightness ?? 0,
      batteryVoltage: row.batteryVoltage ?? null,
      batteryPercent: row.batteryPercent ?? null,
      manualMode: row.manualMode,
      createdAt: new Date(row.createdAt),
    }));
  }

  async getAnalytics(
    deviceId: string,
    period: keyof typeof PERIOD_MAP,
  ): Promise<AnalyticsSummaryDto> {
    const { from, to } = this.resolvePeriod(period);

    const rows = await this.telemetryRepository.find({
      where: { deviceId, createdAt: Between(from, to) },
      order: { createdAt: 'ASC' },
    });

    if (!rows.length) {
      return {
        avgLux: null,
        minLux: null,
        maxLux: null,
        motionCount: 0,
        lightOnMinutes: 0,
        avgBrightness: null,
        batteryMin: null,
        batteryMax: null,
        energyWh: 0,
        energyKwh: 0,
        estimatedSavingsPercent: null,
      };
    }

    let luxSum = 0;
    let luxCount = 0;
    let minLux: number | null = null;
    let maxLux: number | null = null;

    let brightnessSum = 0;
    let brightnessCount = 0;
    let lightOnMs = 0;

    let batteryMin: number | null = null;
    let batteryMax: number | null = null;

    let motionCount = 0;
    let prevMotion = false;

    let energyWh = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nextRow = rows[i + 1];

      // Lux stats
      if (row.lux !== null && row.lux !== undefined) {
        luxSum += row.lux;
        luxCount += 1;
        minLux = minLux === null ? row.lux : Math.min(minLux, row.lux);
        maxLux = maxLux === null ? row.lux : Math.max(maxLux, row.lux);
      }

      // Brightness stats
      if (row.brightness !== null && row.brightness !== undefined) {
        brightnessSum += row.brightness;
        brightnessCount += 1;
      }

      // Battery stats
      if (row.batteryPercent !== null && row.batteryPercent !== undefined) {
        batteryMin = batteryMin === null ? row.batteryPercent : Math.min(batteryMin, row.batteryPercent);
        batteryMax = batteryMax === null ? row.batteryPercent : Math.max(batteryMax, row.batteryPercent);
      }

      // Motion transitions
      if (!prevMotion && row.motion) {
        motionCount += 1;
      }
      prevMotion = row.motion;

      // Energy & light-on time between current and next row
      if (nextRow) {
        const deltaMs = nextRow.createdAt.getTime() - row.createdAt.getTime();
        if (deltaMs > 0) {
          const brightness = row.brightness ?? 0;
          const effectivePower = this.defaultPowerWatts * (brightness / 255);
          const deltaHours = deltaMs / (1000 * 60 * 60);
          energyWh += effectivePower * deltaHours;

          if (brightness > 0) {
            lightOnMs += deltaMs;
          }
        }
      }
    }

    const avgLux = luxCount ? luxSum / luxCount : null;
    const avgBrightness = brightnessCount ? brightnessSum / brightnessCount : null;
    const energyKwh = energyWh / 1000;
    const lightOnMinutes = Math.round(lightOnMs / 60000);

    const firstTs = rows[0].createdAt.getTime();
    const lastTs = rows[rows.length - 1].createdAt.getTime();
    const totalHours = (lastTs - firstTs) / (1000 * 60 * 60);
    const baselineEnergyWh = totalHours > 0 ? this.defaultPowerWatts * totalHours : 0;
    const estimatedSavingsPercent = baselineEnergyWh > 0
      ? ((baselineEnergyWh - energyWh) / baselineEnergyWh) * 100
      : null;

    return {
      avgLux,
      minLux,
      maxLux,
      motionCount,
      lightOnMinutes,
      avgBrightness,
      batteryMin,
      batteryMax,
      energyWh: Number(energyWh.toFixed(4)),
      energyKwh: Number(energyKwh.toFixed(6)),
      estimatedSavingsPercent: estimatedSavingsPercent !== null
        ? Number(estimatedSavingsPercent.toFixed(1))
        : null,
    };
  }

  private resolvePeriod(period: keyof typeof PERIOD_MAP) {
    if (!PERIOD_MAP[period]) {
      throw new HttpException('Некорректный период', HttpStatus.BAD_REQUEST);
    }
    const to = new Date();
    const days = PERIOD_MAP[period];
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  mapStatus(device: DeviceEntity): DeviceStatusResponseDto {
    return {
      deviceId: device.deviceId,
      lux: device.lux,
      motion: device.motion,
      brightness: device.brightness,
      batteryVoltage: device.batteryVoltage,
      batteryPercent: device.batteryPercent,
      manualMode: device.manualMode,
      lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null,
    };
  }

  private mapSchedule(
    deviceId: string,
    schedule: DeviceScheduleEntity,
  ): DeviceScheduleResponseDto {
    return {
      deviceId,
      onHour: schedule.onHour,
      onMinute: schedule.onMinute,
      offHour: schedule.offHour,
      offMinute: schedule.offMinute,
    };
  }
}
