import type { Request } from 'express';
import type { UserRole, UserStatus } from '../../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  universityId?: string | null;
  departmentId?: string | null;
  studentId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date | string;
}

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};
