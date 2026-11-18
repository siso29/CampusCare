import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser, AuthenticatedRequest } from '../types/auth-user.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
