import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LedState } from './entities/led.entity';
import { DeviceEntity } from './entities/device.entity';
import { DeviceScheduleEntity } from './entities/device-schedule.entity';
import { DeviceTelemetryEntity } from './entities/device-telemetry.entity';
import { ZoneEntity } from './entities/zone.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: true,
      entities: [
        __dirname + '/../**/*.entity{.ts,.js}',
        DeviceEntity,
        DeviceScheduleEntity,
        DeviceTelemetryEntity,
        ZoneEntity,
        LedState,
      ],
    }),
  ],
  controllers: [],
  providers: [],
})
export class DataBaseModule {}
