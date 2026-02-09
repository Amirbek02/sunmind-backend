import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataBaseModule } from './module/database/database.module';
import { LedModule } from './module/led/led.module';
import { CustomLogger } from './helpers/logger/logger.service';
import { MotionModule } from './module/motion/motion.module';
import { PubLedModule } from './module/pubLed/pubLed.module';
import { RoleModule } from './module/role/role.module';
import { UserModule } from './module/user/user.module';
import { AuthService } from './module/auth/auth.service';
import { AuthModule } from './module/auth/auth.module';

@Module({
  imports: [
    DataBaseModule,
    LedModule,
    MotionModule,
    PubLedModule,
    RoleModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, CustomLogger],
})
export class AppModule {}
