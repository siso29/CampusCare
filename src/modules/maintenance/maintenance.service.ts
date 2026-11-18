import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import type {
  AssignRequestDto,
  ChangeStatusDto,
  CreateCommentDto,
  CreateRequestDto,
  QueryRequestsDto,
} from './dto/requests.dto.js';
import { VALID_STATUS_TRANSITIONS } from './workflow.constants.js';
import type { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateRequestDto) {
    if (!user.universityId) {
      throw new ForbiddenException('User must belong to a university to create requests');
    }

    // Verify campus belongs to user's university
    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, universityId: user.universityId, isActive: true },
    });
    if (!campus) {
      throw new BadRequestException('Selected campus does not belong to your university');
    }

    // Verify building belongs to campus
    const building = await this.prisma.building.findFirst({
      where: { id: dto.buildingId, campusId: campus.id, isActive: true },
    });
    if (!building) {
      throw new BadRequestException('Selected building does not belong to the selected campus');
    }

    // Verify category exists
    const category = await this.prisma.maintenanceCategory.findFirst({
      where: { id: dto.categoryId, isActive: true },
    });
    if (!category) {
      throw new BadRequestException('Selected category does not exist or is inactive');
    }

    // Generate unique request number
    const count = await this.prisma.maintenanceRequest.count({
      where: { universityId: user.universityId },
    });
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    const requestNumber = `REQ-DDU-${year}-${sequence}`;

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRequest.create({
        data: {
          requestNumber,
          universityId: user.universityId!,
          campusId: dto.campusId,
          buildingId: dto.buildingId,
          departmentId: dto.departmentId,
          categoryId: dto.categoryId,
          reporterId: user.id,
          title: dto.title,
          description: dto.description,
          locationDetails: dto.locationDetails,
          priority: dto.priority || 'MEDIUM',
          status: 'SUBMITTED',
          statusHistories: {
            create: {
              actorId: user.id,
              fromStatus: null,
              toStatus: 'SUBMITTED',
              reason: 'Initial request submission',
            },
          },
        },
        include: {
          campus: { select: { id: true, name: true, code: true } },
          building: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, code: true } },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
            },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          universityId: user.universityId,
          actorId: user.id,
          action: 'REQUEST_CREATED',
          entityType: 'MaintenanceRequest',
          entityId: created.id,
          details: { requestNumber, priority: created.priority },
        },
      });

      return created;
    });

    return request;
  }

  async findMany(user: AuthUser, query: QueryRequestsDto) {
    if (!user.universityId) {
      throw new ForbiddenException('User must belong to a university');
    }

    const where: Prisma.MaintenanceRequestWhereInput = {
      universityId: user.universityId,
    };

    // Role-based visibility scoping
    if (user.role === 'STUDENT') {
      // Students can ONLY view their own reported requests
      where.reporterId = user.id;
    } else if (user.role === 'MAINTENANCE_STAFF') {
      // Staff can view requests assigned to them or in their department
      if (user.departmentId) {
        where.OR = [
          { assignments: { some: { staffId: user.id } } },
          { departmentId: user.departmentId },
          { departmentId: null },
        ];
      }
    }

    // Optional filters
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.campusId) where.campusId = query.campusId;
    if (query.buildingId) where.buildingId = query.buildingId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { requestNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.maintenanceRequest.count({ where }),
      this.prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          campus: { select: { id: true, name: true, code: true } },
          building: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, code: true } },
          reporter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignments: {
            include: {
              staff: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        campus: true,
        building: true,
        department: true,
        category: true,
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            studentId: true,
          },
        },
        assignments: {
          include: {
            staff: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            assignedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        attachments: true,
        statusHistories: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    // Enforce Tenant Isolation
    if (request.universityId !== user.universityId && user.role !== 'ADMIN') {
      throw new ForbiddenException('Cross-university access denied');
    }

    // Enforce Student Privacy
    if (user.role === 'STUDENT' && request.reporterId !== user.id) {
      throw new ForbiddenException('You cannot access another student’s private request');
    }

    // Filter out internal comments from student view
    if (user.role === 'STUDENT') {
      request.comments = request.comments.filter((c) => !c.isInternal);
    }

    return request;
  }

  async changeStatus(user: AuthUser, id: string, dto: ChangeStatusDto) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    // Multi-tenant check
    if (request.universityId !== user.universityId) {
      throw new ForbiddenException('Cross-university access denied');
    }

    // Role and ownership check for status transitions
    const transitionRules = VALID_STATUS_TRANSITIONS[request.status];
    if (!transitionRules || !transitionRules.allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${request.status} to ${dto.status}`,
      );
    }

    if (!transitionRules.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} is not permitted to transition request from ${request.status} to ${dto.status}`,
      );
    }

    // Specific student rules
    if (user.role === 'STUDENT') {
      if (request.reporterId !== user.id) {
        throw new ForbiddenException('You can only update status on your own request');
      }
      if (!['CANCELLED', 'CLOSED', 'REOPENED'].includes(dto.status)) {
        throw new ForbiddenException(
          `Students can only cancel submitted requests or close/reopen resolved requests`,
        );
      }
    }

    // Specific staff rules
    if (user.role === 'MAINTENANCE_STAFF') {
      const isAssigned = request.assignments.some((a) => a.staffId === user.id);
      if (!isAssigned) {
        throw new ForbiddenException('Only assigned staff can update work progress');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: dto.status,
          resolvedAt: dto.status === 'RESOLVED' ? new Date() : request.resolvedAt,
          closedAt: dto.status === 'CLOSED' ? new Date() : request.closedAt,
          statusHistories: {
            create: {
              actorId: user.id,
              fromStatus: request.status,
              toStatus: dto.status,
              reason: dto.reason || `Status updated to ${dto.status}`,
            },
          },
        },
      });

      // Notify the reporter
      if (request.reporterId !== user.id) {
        await tx.notification.create({
          data: {
            userId: request.reporterId,
            title: `Request ${request.requestNumber} status updated`,
            message: `Your maintenance request status has changed to ${dto.status}. ${dto.reason ? `Reason: ${dto.reason}` : ''}`,
            type: 'REQUEST_STATUS_UPDATED',
            resourceId: request.id,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          universityId: user.universityId,
          actorId: user.id,
          action: 'REQUEST_STATUS_CHANGED',
          entityType: 'MaintenanceRequest',
          entityId: request.id,
          details: {
            fromStatus: request.status,
            toStatus: dto.status,
            reason: dto.reason,
          },
        },
      });

      return updatedRequest;
    });

    return updated;
  }

  async assignStaff(user: AuthUser, id: string, dto: AssignRequestDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can assign maintenance staff');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    if (request.universityId !== user.universityId) {
      throw new ForbiddenException('Cross-university assignment is forbidden');
    }

    // Verify staff exists and belongs to same university
    const staff = await this.prisma.user.findFirst({
      where: {
        id: dto.staffId,
        universityId: user.universityId,
        role: 'MAINTENANCE_STAFF',
        status: 'ACTIVE',
      },
    });

    if (!staff) {
      throw new BadRequestException('Selected staff user not found or is not active');
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      // Create assignment record
      const createdAssignment = await tx.maintenanceAssignment.create({
        data: {
          requestId: id,
          staffId: dto.staffId,
          assignedById: user.id,
          status: 'ASSIGNED',
          notes: dto.notes,
        },
      });

      // Update request status to ASSIGNED if previously SUBMITTED, UNDER_REVIEW, or APPROVED
      if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(request.status)) {
        await tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: 'ASSIGNED',
            statusHistories: {
              create: {
                actorId: user.id,
                fromStatus: request.status,
                toStatus: 'ASSIGNED',
                reason: `Assigned to ${staff.firstName} ${staff.lastName}. ${dto.notes || ''}`,
              },
            },
          },
        });
      }

      // Notify the staff member
      await tx.notification.create({
        data: {
          userId: staff.id,
          title: `New Maintenance Task Assigned: ${request.requestNumber}`,
          message: `You have been assigned to: ${request.title}. Location: ${request.locationDetails}`,
          type: 'REQUEST_ASSIGNED',
          resourceId: request.id,
        },
      });

      // Notify the student reporter
      await tx.notification.create({
        data: {
          userId: request.reporterId,
          title: `Staff assigned to ${request.requestNumber}`,
          message: `Maintenance staff ${staff.firstName} ${staff.lastName} has been assigned to your request.`,
          type: 'REQUEST_ASSIGNED',
          resourceId: request.id,
        },
      });

      return createdAssignment;
    });

    return assignment;
  }

  async addComment(user: AuthUser, id: string, dto: CreateCommentDto) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    if (request.universityId !== user.universityId) {
      throw new ForbiddenException('Cross-university access denied');
    }

    if (user.role === 'STUDENT') {
      if (request.reporterId !== user.id) {
        throw new ForbiddenException('You cannot comment on another student’s request');
      }
      if (dto.isInternal) {
        throw new ForbiddenException('Students cannot create internal staff notes');
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceComment.create({
        data: {
          requestId: id,
          authorId: user.id,
          message: dto.message,
          isInternal: dto.isInternal || false,
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      // Send notifications if not an internal note
      if (!dto.isInternal) {
        if (user.role === 'STUDENT') {
          // Notify assigned staff
          for (const a of request.assignments) {
            await tx.notification.create({
              data: {
                userId: a.staffId,
                title: `New comment on ${request.requestNumber}`,
                message: `${user.firstName} ${user.lastName}: ${dto.message.slice(0, 100)}`,
                type: 'REQUEST_COMMENT_ADDED',
                resourceId: request.id,
              },
            });
          }
        } else {
          // Staff/Admin comment - notify student
          if (request.reporterId !== user.id) {
            await tx.notification.create({
              data: {
                userId: request.reporterId,
                title: `Update on your request ${request.requestNumber}`,
                message: `${user.firstName} ${user.lastName}: ${dto.message.slice(0, 100)}`,
                type: 'REQUEST_COMMENT_ADDED',
                resourceId: request.id,
              },
            });
          }
        }
      }

      return created;
    });

    return comment;
  }
}
