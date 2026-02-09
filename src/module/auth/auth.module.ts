import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: 'SECRET_KEY', // В реальности используйте .env
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomLogger],
  exports: [AuthService],
})
export class AuthModule {}
