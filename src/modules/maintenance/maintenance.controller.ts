import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import {
  AssignRequestApiDto,
  AssignRequestSchema,
  ChangeStatusApiDto,
  ChangeStatusSchema,
  CreateCommentApiDto,
  CreateCommentSchema,
  CreateRequestApiDto,
  CreateRequestSchema,
  QueryRequestsApiDto,
  QueryRequestsSchema,
} from './dto/requests.dto.js';

@ApiTags('Maintenance Requests')
@ApiBearerAuth('sessionCookie')
@Controller('requests')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  @Roles('STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Submit a new maintenance request' })
  @ApiResponse({ status: 201, description: 'Request created successfully' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateRequestApiDto,
  ) {
    const validated = CreateRequestSchema.parse(body);
    return this.service.create(user, validated);
  }

  @Get()
  @Roles('STUDENT', 'MAINTENANCE_STAFF', 'ADMIN')
  @ApiOperation({ summary: 'List maintenance requests (scoped by role and tenant)' })
  async findMany(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryRequestsApiDto,
  ) {
    const validated = QueryRequestsSchema.parse(query);
    return this.service.findMany(user, validated);
  }

  @Get(':id')
  @Roles('STUDENT', 'MAINTENANCE_STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Get details of a specific maintenance request' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.service.findOne(user, id);
  }

  @Patch(':id/status')
  @Roles('STUDENT', 'MAINTENANCE_STAFF', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the status of a maintenance request' })
  async changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: ChangeStatusApiDto,
  ) {
    const validated = ChangeStatusSchema.parse(body);
    return this.service.changeStatus(user, id, validated);
  }

  @Post(':id/assign')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a maintenance staff member to the request (Admin only)' })
  async assignStaff(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AssignRequestApiDto,
  ) {
    const validated = AssignRequestSchema.parse(body);
    return this.service.assignStaff(user, id, validated);
  }

  @Post(':id/comments')
  @Roles('STUDENT', 'MAINTENANCE_STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Add a comment or internal staff note to the request' })
  async addComment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateCommentApiDto,
  ) {
    const validated = CreateCommentSchema.parse(body);
    return this.service.addComment(user, id, validated);
  }
}
