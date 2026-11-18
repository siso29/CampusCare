import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const UpdateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  statusChangeAlerts: z.boolean().optional(),
  assignmentAlerts: z.boolean().optional(),
  commentAlerts: z.boolean().optional(),
});

export type UpdateNotificationPreferencesDto = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;

export class UpdateNotificationPreferencesApiDto {
  @ApiPropertyOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  inAppNotifications?: boolean;

  @ApiPropertyOptional()
  statusChangeAlerts?: boolean;

  @ApiPropertyOptional()
  assignmentAlerts?: boolean;

  @ApiPropertyOptional()
  commentAlerts?: boolean;
}
