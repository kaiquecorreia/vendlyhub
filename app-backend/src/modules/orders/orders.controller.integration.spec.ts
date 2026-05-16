import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController (integration)', () => {
  let app: INestApplication;
  const ordersService = {
    createPublicOrder: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /catalog/:slug/orders creates order', async () => {
    ordersService.createPublicOrder.mockResolvedValue({ id: 'ord-1' });

    await request(app.getHttpServer())
      .post('/catalog/5511999998888/orders')
      .send({
        customerName: 'Maria',
        customerWhatsapp: '11999999999',
        customerAddress: 'Rua A, 100',
        items: [{ productId: 'prd-1', quantity: 1 }],
      })
      .expect(201)
      .expect({ id: 'ord-1' });
  });
});
