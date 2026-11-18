import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AuthService } from '../../modules/auth/auth.service.js';
import { SESSION_COOKIE_NAME } from '../utils/cookies.js';
import type { AuthenticatedRequest } from '../types/auth-user.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Try reading session token from HttpOnly cookie
    let token: string | undefined = request.cookies?.[SESSION_COOKIE_NAME];

    // 2. Or fallback to Authorization: Bearer <token>
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (token) {
      const user = await this.authService.validateSession(token);
      if (user) {
        request.user = user;
      }
    }

    if (isPublic) {
      return true;
    }

    if (!request.user) {
      throw new UnauthorizedException('Authentication required. Please log in.');
    }

    return true;
  }
}
