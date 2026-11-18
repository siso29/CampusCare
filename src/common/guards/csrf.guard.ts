import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    // Safe read-only HTTP methods are exempt
    if (safeMethods.includes(request.method.toUpperCase())) {
      return true;
    }

    // Check Sec-Fetch-Site (modern browser standard defense)
    const secFetchSite = request.headers['sec-fetch-site'];
    if (secFetchSite === 'cross-site') {
      throw new ForbiddenException('Cross-site requests are forbidden (CSRF protection)');
    }

    // Double submit cookie check or custom header check
    const csrfCookie = request.cookies?.['campuscare_csrf'];
    const csrfHeader = request.headers['x-csrf-token'];

    if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
