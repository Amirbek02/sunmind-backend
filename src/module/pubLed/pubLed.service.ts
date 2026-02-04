import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt from 'mqtt';

export interface DeviceStatus {
  led_state: string;
  manual_mode: boolean;
  motion_active: boolean;
  toggle_count: number;
  uptime: number;
  ip: string;
}

@Injectable()
export class PubLedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubLedService.name);
  private client: mqtt.MqttClient;
  private readonly topics = {
    control: 'home/light/control',
    status: 'home/light/status',
    mode: 'home/light/mode',
  };

  private deviceStatus: DeviceStatus | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private async connect(): Promise<void> {
    const mqttUrl = this.configService.get<string>(
      'MQTT_URL',
      'mqtt://broker.hivemq.com',
    );

    this.logger.log(
      `Подключение к MQTT брокеру: ${'mqtt://test.mosquitto.org:1883'}`,
    );

    this.client = mqtt.connect('mqtt://test.mosquitto.org:1883', {
      clientId: `nest-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Подключено к MQTT брокеру');

      // Подписываемся на топики
      this.client.subscribe(this.topics.status, (err) => {
        if (err) {
          this.logger.error(`Ошибка подписки на ${this.topics.status}:`, err);
        } else {
          this.logger.log(`📡 Подписался на ${this.topics.status}`);
        }
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === this.topics.status) {
        try {
          const messageStr = message.toString();
          this.logger.debug(`Получено сообщение: ${messageStr}`);

          // Пробуем парсить как JSON
          try {
            const data = JSON.parse(messageStr) as DeviceStatus;
            this.deviceStatus = data;
            this.logger.log(
              `✅ Статус устройства (JSON): ${JSON.stringify(data)}`,
            );
          } catch (jsonError) {
            // Если не JSON, пробуем парсить как простую строку
            this.parseSimpleStatus(messageStr);
          }
        } catch (err) {
          this.logger.error('Ошибка обработки сообщения:', err);
        }
      }
    });

    this.client.on('error', (error: Error) => {
      this.logger.error('MQTT ошибка:', error);
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT отключено');
    });

    this.client.on('reconnect', () => {
      this.logger.log('Переподключение к MQTT...');
    });
  }

  // Парсинг простого текстового статуса (например, "LIGHT_ON" или "LIGHT_OFF")
  private parseSimpleStatus(message: string): void {
    message = message.trim().toUpperCase();

    // Создаем базовый статус
    const baseStatus: DeviceStatus = {
      led_state: 'UNKNOWN',
      manual_mode: true,
      motion_active: false,
      toggle_count: 0,
      uptime: 0,
      ip: '0.0.0.0',
    };

    // Определяем состояние света
    if (message.includes('ON') || message === 'ON') {
      baseStatus.led_state = 'ON';
    } else if (message.includes('OFF') || message === 'OFF') {
      baseStatus.led_state = 'OFF';
    }

    // Пробуем извлечь данные из строки
    const parts = message.split('_');
    for (const part of parts) {
      if (part === 'AUTO') baseStatus.manual_mode = false;
      if (part === 'MANUAL') baseStatus.manual_mode = true;
      if (part === 'MOTION') baseStatus.motion_active = true;
    }

    this.deviceStatus = baseStatus;
    this.logger.log(
      `✅ Статус устройства (текст): ${message} -> ${JSON.stringify(baseStatus)}`,
    );
  }

  private disconnect(): void {
    if (this.client) {
      this.client.end();
      this.logger.log('Отключено от MQTT');
    }
  }

  // Управление светом
  turnOn(): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT не подключен');
    }

    this.client.publish(this.topics.control, 'ON');
    this.logger.log('Команда отправлена: ВКЛЮЧИТЬ свет');
  }

  turnOff(): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT не подключен');
    }

    this.client.publish(this.topics.control, 'OFF');
    this.logger.log('Команда отправлена: ВЫКЛЮЧИТЬ свет');
  }

  toggle(): void {
    if (!this.deviceStatus) {
      throw new Error('Статус устройства неизвестен');
    }

    if (this.deviceStatus.led_state === 'ON') {
      this.turnOff();
    } else {
      this.turnOn();
    }
  }

  // Управление режимом
  setMode(mode: 'manual' | 'auto'): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT не подключен');
    }

    this.client.publish(this.topics.mode, mode);
    this.logger.log(`Команда отправлена: установить режим ${mode}`);
  }

  // Получение статуса
  getStatus(): DeviceStatus | null {
    return this.deviceStatus;
  }

  // Проверка подключения
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // Принудительное обновление статуса
  setMockStatus(ledState: 'ON' | 'OFF' = 'OFF'): void {
    this.deviceStatus = {
      led_state: ledState,
      manual_mode: true,
      motion_active: false,
      toggle_count: 0,
      uptime: Date.now() / 1000,
      ip: '127.0.0.1',
    };
    this.logger.log(`✅ Установлен mock статус: ${ledState}`);
  }
}
