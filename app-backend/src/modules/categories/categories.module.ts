import { Module } from '@nestjs/common';
import { ClsService } from '../../shared/prisma/cls.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [ClsService, PrismaService, CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
