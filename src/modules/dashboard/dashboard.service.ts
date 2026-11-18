import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../../common/types/auth-user.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(user: AuthUser) {
    if (!user.universityId) {
      throw new ForbiddenException('User must belong to a university');
    }

    if (user.role === 'STUDENT') {
      return this.getStudentMetrics(user);
    }
    if (user.role === 'MAINTENANCE_STAFF') {
      return this.getStaffMetrics(user);
    }
    return this.getAdminMetrics(user);
  }

  private async getStudentMetrics(user: AuthUser) {
    const [totalRequests, statusCounts, recentRequests] = await Promise.all([
      this.prisma.maintenanceRequest.count({
        where: { universityId: user.universityId!, reporterId: user.id },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: { universityId: user.universityId!, reporterId: user.id },
        _count: { status: true },
      }),
      this.prisma.maintenanceRequest.findMany({
        where: { universityId: user.universityId!, reporterId: user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          requestNumber: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap = statusCounts.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {});

    return {
      role: 'STUDENT',
      totalRequests,
      statusBreakdown: statusMap,
      recentRequests,
    };
  }

  private async getStaffMetrics(user: AuthUser) {
    const [assignedTotal, activeAssignments, resolvedAssignments, priorityCounts] =
      await Promise.all([
        this.prisma.maintenanceAssignment.count({
          where: { staffId: user.id },
        }),
        this.prisma.maintenanceAssignment.count({
          where: {
            staffId: user.id,
            status: { in: ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.maintenanceAssignment.count({
          where: {
            staffId: user.id,
            status: 'COMPLETED',
          },
        }),
        this.prisma.maintenanceRequest.groupBy({
          by: ['priority'],
          where: {
            assignments: { some: { staffId: user.id } },
          },
          _count: { priority: true },
        }),
      ]);

    const priorityMap = priorityCounts.reduce<Record<string, number>>(
      (acc, curr) => {
        acc[curr.priority] = curr._count.priority;
        return acc;
      },
      {},
    );

    return {
      role: 'MAINTENANCE_STAFF',
      assignedTotal,
      activeTasks: activeAssignments,
      completedTasks: resolvedAssignments,
      priorityBreakdown: priorityMap,
    };
  }

  private async getAdminMetrics(user: AuthUser) {
    const universityId = user.universityId!;

    const [
      totalRequests,
      statusCounts,
      priorityCounts,
      categoryCounts,
      campusCounts,
      staffWorkload,
      resolvedRequests,
    ] = await Promise.all([
      this.prisma.maintenanceRequest.count({ where: { universityId } }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: { universityId },
        _count: { status: true },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where: { universityId },
        _count: { priority: true },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['categoryId'],
        where: { universityId },
        _count: { categoryId: true },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['campusId'],
        where: { universityId },
        _count: { campusId: true },
      }),
      this.prisma.user.findMany({
        where: { universityId, role: 'MAINTENANCE_STAFF', status: 'ACTIVE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true, code: true } },
          assignments: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
            select: { id: true },
          },
        },
      }),
      this.prisma.maintenanceRequest.findMany({
        where: {
          universityId,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
        },
        select: { createdAt: true, resolvedAt: true },
        take: 100,
      }),
    ]);

    // Calculate average resolution time in hours
    let avgResolutionHours = 0;
    if (resolvedRequests.length > 0) {
      const totalHours = resolvedRequests.reduce((acc, curr) => {
        if (!curr.resolvedAt) return acc;
        const diffMs = curr.resolvedAt.getTime() - curr.createdAt.getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedRequests.length) * 10) / 10;
    }

    const categories = await this.prisma.maintenanceCategory.findMany({
      where: { id: { in: categoryCounts.map((c) => c.categoryId) } },
      select: { id: true, name: true, code: true },
    });
    const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

    const campuses = await this.prisma.campus.findMany({
      where: { id: { in: campusCounts.map((c) => c.campusId) } },
      select: { id: true, name: true, code: true },
    });
    const campusNameMap = new Map(campuses.map((c) => [c.id, c.name]));

    return {
      role: 'ADMIN',
      totalRequests,
      averageResolutionHours: avgResolutionHours,
      statusBreakdown: statusCounts.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {}),
      priorityBreakdown: priorityCounts.reduce<Record<string, number>>(
        (acc, curr) => {
          acc[curr.priority] = curr._count.priority;
          return acc;
        },
        {},
      ),
      categoryBreakdown: categoryCounts.map((c) => ({
        categoryId: c.categoryId,
        name: categoryNameMap.get(c.categoryId) || 'Unknown',
        count: c._count.categoryId,
      })),
      campusBreakdown: campusCounts.map((c) => ({
        campusId: c.campusId,
        name: campusNameMap.get(c.campusId) || 'Unknown',
        count: c._count.campusId,
      })),
      staffWorkload: staffWorkload.map((s) => ({
        staffId: s.id,
        name: `${s.firstName} ${s.lastName}`,
        department: s.department?.name || 'General',
        activeTaskCount: s.assignments.length,
      })),
    };
  }
}
