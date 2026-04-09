import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class DeviceStatusResponseDto {
  deviceId!: string;
  lux?: number;
  motion!: boolean;
  brightness?: number;
  batteryVoltage?: number;
  batteryPercent?: number;
  manualMode!: boolean;
  lastSeen!: string | null;
}

export class DeviceScheduleDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  onHour!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  onMinute!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  offHour!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  offMinute!: number;
}

export class DeviceScheduleResponseDto extends DeviceScheduleDto {
  deviceId!: string;
}
