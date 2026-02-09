import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RefId } from 'src/decorators/ref.decorator';
import { UserCreateDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: CustomLogger,
  ) {}

  @Post('register')
  async register(@Body() userData: UserCreateDto, @RefId() refId: string) {
    this.logger.debug(
      `[CONTROLLER] register: ${JSON.stringify(userData)}`,
      refId,
    );
    try {
      const user = await this.authService.register(userData, refId);
      if (user) {
        this.logger.debug(
          `[CONTROLLER] register SUCCESS: ${user.email}`,
          refId,
        );
      }
      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] register failed: ${error}`, refId);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() userData: any, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] login: ${JSON.stringify(userData)}`, refId);
    try {
      const user = await this.authService.login(userData, refId);
      if (user) {
        this.logger.debug(`[CONTROLLER] login SUCCESS: ${user}`, refId);
      }

      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] login failed: ${error}`, refId);
      throw error;
    }
  }

  @Get('me')
  async aboutMe(
    @Headers('authorization') authHeader: string,
    @RefId() refId: string,
  ) {
    if (!authHeader) {
      this.logger.error(
        `[CONTROLLER] aboutme failed: Authorization header missing`,
        refId,
      );
      throw new BadRequestException('Authorization header is missing');
    }

    const token = authHeader.replace('Bearer ', '').trim(); // убираем пробелы
    this.logger.debug(`[CONTROLLER] aboutme: ${token}`, refId);
    try {
      const user = await this.authService.aboutMe(token, refId);
      this.logger.debug(`[CONTROLLER] aboutme SUCCESS: ${user}`, refId);
      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] aboutme failed: ${error}`, refId);
      throw error;
    }
  }
}
