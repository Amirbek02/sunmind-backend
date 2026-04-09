import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeviceService } from './device.service';
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
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { UseGuards, Req } from '@nestjs/common';

@ApiTags('Device')
@Controller('api')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly zoneService: ZoneService,
  ) {}

  @Post('device-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Прием телеметрии от устройства' })
  async handleTelemetry(
    @Body() dto: DeviceDataDto,
  ): Promise<DeviceStatusResponseDto> {
    return this.deviceService.saveTelemetry(dto);
  }

  @Post('devices/register')
  @UseGuards(JwtAuthGuard as any)
  @ApiOperation({ summary: 'Регистрация устройства по QR/ID и привязка к зоне' })
  async register(
    @Req() req,
    @Body() dto: DeviceRegisterDto,
  ): Promise<DeviceStatusResponseDto> {
    const userId = req.user?.sub || req.user?.id;
    return this.deviceService.registerDevice(dto, userId);
  }

  @Get('devices/:deviceId/status')
  @ApiOperation({ summary: 'Текущее состояние устройства' })
  async getStatus(
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceStatusResponseDto> {
    return this.deviceService.getStatus(deviceId);
  }

  @Get('devices/:deviceId/telemetry')
  @ApiOperation({ summary: 'История телеметрии устройства' })
  async getTelemetry(
    @Param('deviceId') deviceId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ): Promise<DeviceTelemetryResponseDto[]> {
    return this.deviceService.getTelemetry(deviceId, period);
  }

  @Get('devices/:deviceId/analytics')
  @ApiOperation({ summary: 'Аналитика по устройству' })
  async getAnalytics(
    @Param('deviceId') deviceId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ): Promise<AnalyticsSummaryDto> {
    return this.deviceService.getAnalytics(deviceId, period);
  }

  @Get('devices/:deviceId/schedule')
  @ApiOperation({ summary: 'Получить расписание устройства' })
  async getSchedule(
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceScheduleResponseDto> {
    return this.deviceService.getSchedule(deviceId);
  }

  @Post('devices/:deviceId/schedule')
  @ApiOperation({ summary: 'Сохранить расписание устройства' })
  async setSchedule(
    @Param('deviceId') deviceId: string,
    @Body() dto: DeviceScheduleDto,
  ): Promise<DeviceScheduleResponseDto> {
    return this.deviceService.setSchedule(deviceId, dto);
  }
}
