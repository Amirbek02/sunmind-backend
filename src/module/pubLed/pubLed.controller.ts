// device.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { PubLedService } from './pubLed.service';

@Controller('device')
export class PubLedController {
  constructor(private readonly mqttService: PubLedService) {}

  @Get('status')
  getStatus() {
    const status = this.mqttService.getStatus();
    if (!status) {
      return {
        status: 'error',
        message: 'Статус устройства не доступен. Проверьте подключение.',
      };
    }

    return {
      status: 'success',
      data: status,
      mqtt_connected: this.mqttService.isConnected(),
    };
  }

  @Post('on')
  async turnOn() {
    await this.mqttService.turnOn();
    return { status: 'success', message: 'Команда включения отправлена' };
  }

  @Post('off')
  async turnOff() {
    await this.mqttService.turnOff();
    return { status: 'success', message: 'Команда выключения отправлена' };
  }

  @Post('toggle')
  async toggle() {
    await this.mqttService.toggle();
    return { status: 'success', message: 'Команда переключения отправлена' };
  }

  @Post('mode')
  async setMode(@Body() body: { mode: 'manual' | 'auto' }) {
    await this.mqttService.setMode(body.mode);
    return {
      status: 'success',
      message: `Режим установлен на ${body.mode}`,
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      mqtt_connected: this.mqttService.isConnected(),
      device_status_available: !!this.mqttService.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}
