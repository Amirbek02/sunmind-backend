import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { UserCreateDto } from './dto/create-user.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { RoleEntity } from '../database/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneById(decoded): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { id: decoded.sub },
      relations: ['roles'],
    });

    console.log(user);

    return user;
  }

  async createUser(userData: UserCreateDto, refId: string) {
    this.logger.debug(
      `[SERVICE] createUser: ${JSON.stringify(userData)}`,
      refId,
    );
    try {
      this.logger.debug(`[SERVICE] createUser SUCCESS`, refId);
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      let role = await this.roleRepository.findOne({
        where: { role_name: 'USER' },
      });

      if (!role) {
        role = await this.roleRepository.save({
          role_name: 'USER',
          description: 'Default user role',
        });
      }

      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        roles: [role],
      });
      return await this.userRepository.save(user);
    } catch (error) {}
  }
}
