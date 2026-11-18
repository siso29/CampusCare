import { Module } from '@nestjs/common';
import { UniversitiesService } from './universities.service.js';
import { UniversitiesController } from './universities.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
