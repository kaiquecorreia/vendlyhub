import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('catalog')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':slug/orders')
  async createOrder(@Param('slug') slug: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createPublicOrder(slug, dto);
  }
}
