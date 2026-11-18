import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Universities & Campus Hierarchy')
@Controller()
export class UniversitiesController {
  constructor(private readonly service: UniversitiesService) {}

  @Public()
  @Get('universities')
  @ApiOperation({ summary: 'List all active universities' })
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get('universities/:id')
  @ApiOperation({ summary: 'Get university details with campuses and departments' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Get('universities/:id/campuses')
  @ApiOperation({ summary: 'Get campuses of a university' })
  getCampuses(@Param('id') id: string) {
    return this.service.getCampuses(id);
  }

  @Public()
  @Get('campuses/:id/buildings')
  @ApiOperation({ summary: 'Get buildings within a campus' })
  getBuildings(@Param('id') id: string) {
    return this.service.getBuildings(id);
  }

  @Public()
  @Get('universities/:id/departments')
  @ApiOperation({ summary: 'Get maintenance departments of a university' })
  getDepartments(@Param('id') id: string) {
    return this.service.getDepartments(id);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List all maintenance categories' })
  getCategories() {
    return this.service.getCategories();
  }
}
