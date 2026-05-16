import { Module } from '@nestjs/common';
import { ClsService } from '../../shared/prisma/cls.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TransactionService } from '../../shared/prisma/transaction.service';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [CatalogModule],
  controllers: [OrdersController, OrdersAdminController],
  providers: [ClsService, PrismaService, TransactionService, OrdersService],
})
export class OrdersModule {}
