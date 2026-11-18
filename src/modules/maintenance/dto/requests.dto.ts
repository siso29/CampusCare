import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const MaintenancePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const MaintenanceStatusEnum = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
  'CANCELLED',
  'REOPENED',
]);

export const CreateRequestSchema = z.object({
  campusId: z.string().uuid('Valid campus ID is required'),
  buildingId: z.string().uuid('Valid building ID is required'),
  departmentId: z.string().uuid().optional(),
  categoryId: z.string().uuid('Valid category ID is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  locationDetails: z
    .string()
    .min(3, 'Location details are required (e.g. Room 204, 2nd floor)')
    .max(200),
  priority: MaintenancePriorityEnum.default('MEDIUM'),
});

export type CreateRequestDto = z.infer<typeof CreateRequestSchema>;

export class CreateRequestApiDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  campusId!: string;

  @ApiProperty({ example: 'b2c3d4e5-...' })
  buildingId!: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-...' })
  departmentId?: string;

  @ApiProperty({ example: 'd4e5f6a7-...' })
  categoryId!: string;

  @ApiProperty({ example: 'Leaking pipe under sink in Room 204' })
  title!: string;

  @ApiProperty({ example: 'Water is dripping continuously and forming a pool.' })
  description!: string;

  @ApiProperty({ example: 'Block 01, 2nd Floor, Room 204' })
  locationDetails!: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export const UpdateRequestSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(10).optional(),
  locationDetails: z.string().min(3).max(200).optional(),
  priority: MaintenancePriorityEnum.optional(),
  departmentId: z.string().uuid().optional(),
});

export type UpdateRequestDto = z.infer<typeof UpdateRequestSchema>;

export class UpdateRequestApiDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  description?: string;

  @ApiPropertyOptional({ example: 'Updated location details' })
  locationDetails?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  departmentId?: string;
}

export const ChangeStatusSchema = z.object({
  status: MaintenanceStatusEnum,
  reason: z.string().max(1000).optional(),
});

export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;

export class ChangeStatusApiDto {
  @ApiProperty({ enum: MaintenanceStatusEnum.options })
  status!: z.infer<typeof MaintenanceStatusEnum>;

  @ApiPropertyOptional({ example: 'Work inspected and completed satisfactorily.' })
  reason?: string;
}

export const AssignRequestSchema = z.object({
  staffId: z.string().uuid('Valid maintenance staff ID is required'),
  notes: z.string().max(1000).optional(),
});

export type AssignRequestDto = z.infer<typeof AssignRequestSchema>;

export class AssignRequestApiDto {
  @ApiProperty({ example: 'uuid-of-staff-user' })
  staffId!: string;

  @ApiPropertyOptional({ example: 'Priority repair before student exams.' })
  notes?: string;
}

export const CreateCommentSchema = z.object({
  message: z.string().min(1, 'Comment message cannot be empty').max(3000),
  isInternal: z.boolean().default(false),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;

export class CreateCommentApiDto {
  @ApiProperty({ example: 'Parts ordered from local supplier, ETA 2 hours.' })
  message!: string;

  @ApiPropertyOptional({ default: false, description: 'Internal note visible only to staff and admin' })
  isInternal?: boolean;
}

export const QueryRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: MaintenanceStatusEnum.optional(),
  priority: MaintenancePriorityEnum.optional(),
  categoryId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'requestNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryRequestsDto = z.infer<typeof QueryRequestsSchema>;

export class QueryRequestsApiDto {
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  limit?: number;

  @ApiPropertyOptional({ enum: MaintenanceStatusEnum.options })
  status?: z.infer<typeof MaintenanceStatusEnum>;

  @ApiPropertyOptional({ enum: MaintenancePriorityEnum.options })
  priority?: z.infer<typeof MaintenancePriorityEnum>;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  campusId?: string;

  @ApiPropertyOptional()
  buildingId?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'priority', 'status', 'requestNumber'], default: 'createdAt' })
  sortBy?: 'createdAt' | 'priority' | 'status' | 'requestNumber';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc';
}
