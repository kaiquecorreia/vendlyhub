import { Module } from '@nestjs/common';
import { ClsService } from '../../shared/prisma/cls.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [ClsService, PrismaService, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
