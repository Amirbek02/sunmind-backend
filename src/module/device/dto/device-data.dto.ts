import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class DeviceDataDto {
  @IsString()
  deviceId!: string;

  @IsNumber()
  @Type(() => Number)
  lux!: number;

  @IsBoolean()
  motion!: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(255)
  brightness?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batteryVoltage?: number | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  batteryPercent?: number | null;

  @IsBoolean()
  manualMode!: boolean;

  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}
