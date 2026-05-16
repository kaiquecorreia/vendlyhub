import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersService } from './orders.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => AuthenticatedRequest;
  };
}

describe('OrdersAdminController (integration)', () => {
  let app: INestApplication;
  const ordersService = {
    listForUser: jest.fn(),
    confirmForUser: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersAdminController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: MockExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'user-1' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /orders returns order list', async () => {
    ordersService.listForUser.mockResolvedValue([{ id: 'ord-1' }]);

    await request(app.getHttpServer())
      .get('/orders')
      .expect(200)
      .expect([{ id: 'ord-1' }]);

    expect(ordersService.listForUser).toHaveBeenCalledWith('user-1', {});
  });

  it('PATCH /orders/:id/confirm confirms an order', async () => {
    ordersService.confirmForUser.mockResolvedValue({
      id: 'ord-1',
      status: 'confirmed',
    });

    await request(app.getHttpServer())
      .patch('/orders/ord-1/confirm')
      .expect(200)
      .expect({ id: 'ord-1', status: 'confirmed' });

    expect(ordersService.confirmForUser).toHaveBeenCalledWith(
      'user-1',
      'ord-1',
    );
  });
});
