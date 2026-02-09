import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const requireRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requireRoles) {
      return true;
    }
    const requset = context.switchToHttp().getRequest();
    const authHeader = requset.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const user = this.jwtService.verify(token);

    return user.roles.some((role) => requireRoles.includes(role.role_name));
  }
}
