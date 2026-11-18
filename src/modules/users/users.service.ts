import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import type { UserRole, UserStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, role?: UserRole) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can list users');
    }

    return this.prisma.user.findMany({
      where: {
        universityId: user.universityId,
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        studentId: true,
        department: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaff(user: AuthUser) {
    return this.prisma.user.findMany({
      where: {
        universityId: user.universityId,
        role: 'MAINTENANCE_STAFF',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateUserRoleStatus(
    currentUser: AuthUser,
    targetUserId: string,
    role?: UserRole,
    status?: UserStatus,
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can update roles and account status');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (targetUser.universityId !== currentUser.universityId) {
      throw new ForbiddenException('Cannot modify users from another university');
    }

    // Prevent admin from removing their own admin role
    if (targetUser.id === currentUser.id && role && role !== 'ADMIN') {
      throw new BadRequestException('You cannot demote your own administrator account');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }
}
