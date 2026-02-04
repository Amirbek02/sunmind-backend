import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataBaseModule } from './module/database/database.module';
import { LedModule } from './module/led/led.module';
import { CustomLogger } from './helpers/logger/logger.service';
import { MotionModule } from './module/motion/motion.module';
import { PubLedModule } from './module/pubLed/pubLed.module';

@Module({
  imports: [DataBaseModule, LedModule, MotionModule, PubLedModule],
  controllers: [AppController],
  providers: [AppService, CustomLogger],
})
export class AppModule {}
