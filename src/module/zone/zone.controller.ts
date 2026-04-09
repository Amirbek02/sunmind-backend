import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Post,
  Body,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZoneService } from './zone.service';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { CreateZoneDto } from './dto/create-zone.dto';
import { DeviceService } from '../device/device.service';

@ApiTags('Zones')
@Controller('api/zones')
@UseGuards(JwtAuthGuard as any)
export class ZoneController {
  constructor(
    private readonly zoneService: ZoneService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  @Get()
  async list(@Req() req) {
    const user = req.user;
    const zones = await this.zoneService.list(user.sub || user.id);
    return zones.map((z) => ({
      id: z.id,
      name: z.name,
      devices:
        z.devices?.map((d) => ({
          deviceId: d.deviceId,
          status: this.deviceService.mapStatus(d),
        })) || [],
    }));
  }

  @Post()
  async create(@Req() req, @Body() dto: CreateZoneDto) {
    const user = req.user;
    return this.zoneService.create(dto, user.sub || user.id);
  }

  @Get(':id/devices')
  async devices(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.zoneService.getDevices(Number(id), user.sub || user.id);
  }
}
