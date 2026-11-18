import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser, AuthenticatedRequest } from '../../common/types/auth-user.js';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  RegisterRequestDto,
  LoginRequestDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
} from './dto/auth.dto.js';
import {
  clearCsrfCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  setCsrfCookie,
  setSessionCookie,
} from '../../common/utils/cookies.js';
import { generateRandomToken } from '../../common/utils/crypto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({ status: 201, description: 'Student registered successfully' })
  async register(
    @Body() body: RegisterRequestDto,
    @Req() req: Request,
  ) {
    const validated = RegisterSchema.parse(body);
    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.register(validated, meta);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (sets secure HttpOnly session cookie)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() body: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validated = LoginSchema.parse(body);
    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.login(validated, meta);

    // Set secure HttpOnly session cookie
    setSessionCookie(res, result.sessionToken);

    // Issue CSRF cookie
    const csrfToken = generateRandomToken(24);
    setCsrfCookie(res, csrfToken);

    return {
      user: result.user,
      university: result.university,
      sessionToken: result.sessionToken,
      csrfToken,
      expiresAt: result.expiresAt,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout (clears session and cookies)' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    const token =
      req.cookies?.[SESSION_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : '');

    if (token) {
      await this.authService.logout(token, user?.id);
    }

    clearSessionCookie(res);
    clearCsrfCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordRequestDto,
    @Req() req: Request,
  ) {
    const validated = ChangePasswordSchema.parse(body);
    const currentToken = req.cookies?.[SESSION_COOKIE_NAME];
    return this.authService.changePassword(user.id, validated, currentToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token' })
  async forgotPassword(@Body() body: ForgotPasswordRequestDto) {
    const validated = ForgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(validated);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() body: ResetPasswordRequestDto) {
    const validated = ResetPasswordSchema.parse(body);
    return this.authService.resetPassword(validated);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() body: VerifyEmailRequestDto) {
    const validated = VerifyEmailSchema.parse(body);
    return this.authService.verifyEmail(validated);
  }

  @Public()
  @Get('csrf')
  @ApiOperation({ summary: 'Get CSRF token for state-changing forms' })
  async getCsrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = generateRandomToken(24);
    setCsrfCookie(res, csrfToken);
    return { csrfToken };
  }
}
