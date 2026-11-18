import type { MaintenanceStatus, UserRole } from '../../generated/prisma/enums.js';

export const VALID_STATUS_TRANSITIONS: Record<
  MaintenanceStatus,
  { allowedNext: MaintenanceStatus[]; allowedRoles: UserRole[] }
> = {
  SUBMITTED: {
    allowedNext: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'ASSIGNED'],
    allowedRoles: ['ADMIN', 'STUDENT', 'MAINTENANCE_STAFF'],
  },
  UNDER_REVIEW: {
    allowedNext: ['APPROVED', 'REJECTED', 'CANCELLED', 'ASSIGNED'],
    allowedRoles: ['ADMIN', 'STUDENT'],
  },
  APPROVED: {
    allowedNext: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED', 'CANCELLED'],
    allowedRoles: ['ADMIN'],
  },
  ASSIGNED: {
    allowedNext: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
    allowedRoles: ['ADMIN', 'MAINTENANCE_STAFF'],
  },
  IN_PROGRESS: {
    allowedNext: ['ON_HOLD', 'RESOLVED', 'CANCELLED'],
    allowedRoles: ['ADMIN', 'MAINTENANCE_STAFF'],
  },
  ON_HOLD: {
    allowedNext: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    allowedRoles: ['ADMIN', 'MAINTENANCE_STAFF'],
  },
  RESOLVED: {
    allowedNext: ['CLOSED', 'REOPENED'],
    allowedRoles: ['ADMIN', 'STUDENT'],
  },
  CLOSED: {
    allowedNext: ['REOPENED'],
    allowedRoles: ['ADMIN'],
  },
  REJECTED: {
    allowedNext: ['REOPENED'],
    allowedRoles: ['ADMIN'],
  },
  CANCELLED: {
    allowedNext: [],
    allowedRoles: [],
  },
  REOPENED: {
    allowedNext: ['UNDER_REVIEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'],
    allowedRoles: ['ADMIN', 'MAINTENANCE_STAFF'],
  },
};
