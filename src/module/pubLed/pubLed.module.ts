import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PubLedService } from './pubLed.service';
import { PubLedController } from './pubLed.controller';

@Module({
  imports: [
    HttpModule, // HttpModule - это МОДУЛЬ, его можно в imports
  ],
  controllers: [PubLedController],
  providers: [PubLedService], // Сервисы добавляем в providers
  exports: [PubLedService],
})
export class PubLedModule {}
