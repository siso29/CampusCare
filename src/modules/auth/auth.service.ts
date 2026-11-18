import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  generateRandomToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../../common/utils/crypto.js';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto.js';
import type { AuthUser } from '../../common/types/auth-user.js';

@Injectable()
export class AuthService {
  private readonly sessionTtlDays = Number(process.env.SESSION_TTL_DAYS) || 7;

  constructor(private readonly prisma: PrismaService) {}

  async register(
    dto: RegisterDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const university = await this.prisma.university.findUnique({
      where: { code: dto.universityCode || 'DDU' },
    });

    if (!university) {
      throw new NotFoundException(`University code ${dto.universityCode} not found`);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          universityId: university.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          studentId: dto.studentId,
          phone: dto.phone,
          role: 'STUDENT',
          status: 'ACTIVE',
          notificationPreference: {
            create: {
              emailNotifications: true,
              inAppNotifications: true,
              statusChangeAlerts: true,
              assignmentAlerts: true,
              commentAlerts: true,
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          studentId: true,
          role: true,
          status: true,
          universityId: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          universityId: university.id,
          actorId: createdUser.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: createdUser.id,
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        },
      });

      return createdUser;
    });

    return user;
  }

  async login(
    dto: LoginDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { university: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Your account status is ${user.status}. Please contact university administration.`,
      );
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + this.sessionTtlDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          universityId: user.universityId,
          actorId: user.id,
          action: 'USER_LOGIN',
          entityType: 'Session',
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        },
      });
    });

    const authUser: AuthUser = {
      id: user.id,
      universityId: user.universityId,
      departmentId: user.departmentId,
      studentId: user.studentId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };

    return {
      sessionToken: rawToken,
      expiresAt,
      user: authUser,
      university: user.university
        ? {
            id: user.university.id,
            name: user.university.name,
            code: user.university.code,
            slug: user.university.slug,
          }
        : null,
    };
  }

  async logout(rawToken: string, userId?: string) {
    const tokenHash = hashToken(rawToken);
    await this.prisma.session.deleteMany({
      where: { tokenHash },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'USER_LOGOUT',
          entityType: 'Session',
        },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async validateSession(rawToken: string): Promise<AuthUser | null> {
    if (!rawToken) {
      return null;
    }

    const tokenHash = hashToken(rawToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (session.user.status !== 'ACTIVE') {
      return null;
    }

    // Periodically update lastUsedAt
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.lastUsedAt < fiveMinutesAgo) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});
    }

    return {
      id: session.user.id,
      universityId: session.user.universityId,
      departmentId: session.user.departmentId,
      studentId: session.user.studentId,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      status: session.user.status,
      createdAt: session.user.createdAt,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentRawToken?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      // Revoke all OTHER active sessions
      if (currentRawToken) {
        const currentTokenHash = hashToken(currentRawToken);
        await tx.session.deleteMany({
          where: {
            userId,
            tokenHash: { not: currentTokenHash },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          universityId: user.universityId,
          actorId: userId,
          action: 'PASSWORD_CHANGED',
          entityType: 'User',
          entityId: userId,
        },
      });
    });

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success even if user not found to prevent user enumeration
    if (!user) {
      return {
        message: 'If an account with that email exists, password reset instructions have been issued.',
      };
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // Note: In development/demo, we return the token in non-production environments
    return {
      message: 'If an account with that email exists, password reset instructions have been issued.',
      ...(process.env.NODE_ENV !== 'production' ? { devResetToken: rawToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all active sessions for this user
      await tx.session.deleteMany({
        where: { userId: resetRecord.userId },
      });

      await tx.auditLog.create({
        data: {
          universityId: resetRecord.user.universityId,
          actorId: resetRecord.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          entityType: 'User',
          entityId: resetRecord.userId,
        },
      });
    });

    return { message: 'Password has been reset successfully. Please log in.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = hashToken(dto.token);
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { status: 'ACTIVE' },
      });

      await tx.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
    });

    return { message: 'Email verified successfully. Account is now active.' };
  }
}
