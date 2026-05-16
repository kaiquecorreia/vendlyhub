import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async list(
    @Request() req: { user: { userId: string } },
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.ordersService.listForUser(req.user.userId, query);
  }

  @Patch(':id/confirm')
  async confirmOrder(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.confirmForUser(req.user.userId, id);
  }
}
