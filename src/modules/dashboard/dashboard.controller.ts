import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/types/auth-user.js';

@ApiTags('Dashboards & Analytics')
@ApiBearerAuth('sessionCookie')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get role-tailored dashboard metrics and statistics' })
  async getMetrics(@CurrentUser() user: AuthUser) {
    return this.service.getMetrics(user);
  }
}
