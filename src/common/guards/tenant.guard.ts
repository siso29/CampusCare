import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedRequest } from '../types/auth-user.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Platform Super Admin (no universityId) has multi-tenant authority
    if (user.role === 'ADMIN' && !user.universityId) {
      return true;
    }

    // Every tenant user MUST belong to a valid university
    if (!user.universityId) {
      throw new ForbiddenException('User is not associated with any university');
    }

    // If client supplied universityId in params or query, enforce strict equality
    const paramUniversityId =
      request.params?.universityId ||
      request.params?.tenantId ||
      request.query?.universityId;

    if (paramUniversityId && paramUniversityId !== user.universityId) {
      throw new ForbiddenException('Cross-university access is strictly prohibited');
    }

    return true;
  }
}
