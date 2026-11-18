import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.university.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        domain: true,
        logoUrl: true,
      },
    });
  }

  async findOne(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        campuses: {
          where: { isActive: true },
          include: {
            buildings: {
              where: { isActive: true },
            },
          },
        },
        departments: true,
      },
    });

    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }

    return university;
  }

  async getCampuses(universityId: string) {
    return this.prisma.campus.findMany({
      where: { universityId, isActive: true },
      include: {
        buildings: {
          where: { isActive: true },
        },
      },
    });
  }

  async getBuildings(campusId: string) {
    return this.prisma.building.findMany({
      where: { campusId, isActive: true },
    });
  }

  async getDepartments(universityId: string) {
    return this.prisma.department.findMany({
      where: { universityId },
    });
  }

  async getCategories() {
    return this.prisma.maintenanceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
