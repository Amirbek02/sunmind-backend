import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { UserCreateDto } from '../user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: CustomLogger,
    private jwtService: JwtService,
  ) {}
  async register(userData: UserCreateDto, refId: string) {
    this.logger.debug(`[SERVICE] register: ${JSON.stringify(userData)}`, refId);
    try {
      const existingUser = await this.userService.findOneByEmail(
        userData.email,
      );
      if (existingUser) {
        this.logger.error(
          `[SERVICE] register failed: Email already exists`,
          refId,
        );
        throw new HttpException(
          'Пользователь существует',
          HttpStatus.BAD_REQUEST,
        );
      }
      const user = await this.userService.createUser(userData, refId);
      if (user) {
        this.logger.debug(`[SERVICE] register success: ${user.id}`, refId);
      }
      return user;
    } catch (error) {
      this.logger.error(`[SERVICE] register failed: ${error}`, refId);
      throw error;
    }
  }

  async login(loginData: any, refId: string) {
    this.logger.debug(`[SERVICE] login: ${JSON.stringify(loginData)}`, refId);
    try {
      const user = await this.userService.findOneByEmail(loginData.email);
      if (!user) {
        this.logger.error(`[SERVICE] login failed: User not found`, refId);
        throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
      }

      const passwordEqual = await bcrypt.compare(
        loginData.password,
        user?.password || '',
      );

      if (user && passwordEqual) {
        const payload = { email: user.email, sub: user.id, roles: user.roles };

        return {
          access_token: this.jwtService.sign(payload),
        };
      }

      return user;
    } catch (error) {
      this.logger.error(`[SERVICE] login failed: ${error}`, refId);
      throw error;
    }
  }

  async aboutMe(token: any, refId: string) {
    this.logger.debug(`[SERVICE] aboutMe`, refId);
    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded = this.jwtService.decode(cleanToken);
      console.log(decoded);

      if (typeof decoded === 'object' && decoded.sub) {
        const user = await this.userService.findOneById(decoded);
        if (user) {
          this.logger.debug(`[SERVICE] aboutMe SUCCESS`, refId);
        }
        return user;
      }
    } catch (error) {
      this.logger.error(`[SERVICE] aboutMe failed: ${error}`, refId);
      throw error;
    }
  }
}
