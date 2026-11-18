import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import type { UserRole, UserStatus } from '../../generated/prisma/enums.js';

@ApiTags('User Management')
@ApiBearerAuth('sessionCookie')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List university users (Admin only)' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('role') role?: UserRole,
  ) {
    return this.service.findAll(user, role);
  }

  @Get('staff')
  @Roles('ADMIN', 'MAINTENANCE_STAFF')
  @ApiOperation({ summary: 'Get active maintenance staff directory' })
  async getStaff(@CurrentUser() user: AuthUser) {
    return this.service.getStaff(user);
  }

  @Patch(':id/role-status')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user role or status (Admin only)' })
  async updateUserRoleStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') targetId: string,
    @Body('role') role?: UserRole,
    @Body('status') status?: UserStatus,
  ) {
    return this.service.updateUserRoleStatus(user, targetId, role, status);
  }
}
