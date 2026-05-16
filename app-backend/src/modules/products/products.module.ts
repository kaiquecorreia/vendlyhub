import { Module } from '@nestjs/common';
import { ClsService } from '../../shared/prisma/cls.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ClsService, PrismaService, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
