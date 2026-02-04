import { Controller, Get, Post, Body } from '@nestjs/common';
import { PubLedService } from './pubLed.service';

@Controller('device')
export class PubLedController {
  constructor(private readonly pubLedService: PubLedService) {}

  @Get('status')
  getStatus() {
    const status = this.pubLedService.getStatus();

    if (!status) {
      return {
        status: 'pending',
        message: 'Ожидание данных от устройства...',
        mqtt_connected: this.pubLedService.isConnected(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'success',
      data: status,
      mqtt_connected: this.pubLedService.isConnected(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('on')
  async turnOn() {
    try {
      this.pubLedService.turnOn();
      return {
        status: 'success',
        message: 'Команда включения отправлена',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('off')
  async turnOff() {
    try {
      this.pubLedService.turnOff();
      return {
        status: 'success',
        message: 'Команда выключения отправлена',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('toggle')
  async toggle() {
    try {
      this.pubLedService.toggle();
      return {
        status: 'success',
        message: 'Команда переключения отправлена',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Если статус неизвестен, пробуем включить свет
      if (error.message === 'Статус устройства неизвестен') {
        this.pubLedService.turnOn();
        return {
          status: 'success',
          message: 'Статус был неизвестен, отправлена команда включения',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('mode')
  async setMode(@Body() body: { mode: 'manual' | 'auto' }) {
    if (!body.mode || !['manual', 'auto'].includes(body.mode)) {
      return {
        status: 'error',
        message: 'Неверный режим. Используйте "manual" или "auto"',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      this.pubLedService.setMode(body.mode);
      return {
        status: 'success',
        message: `Команда установки режима отправлена: ${body.mode}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('mock')
  async setMockStatus(@Body() body: { state: 'ON' | 'OFF' }) {
    this.pubLedService.setMockStatus(body.state);
    return {
      status: 'success',
      message: `Mock статус установлен: ${body.state}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      mqtt_connected: this.pubLedService.isConnected(),
      device_status_available: !!this.pubLedService.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}
