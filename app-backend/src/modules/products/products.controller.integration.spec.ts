import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => AuthenticatedRequest;
  };
}

describe('ProductsController (integration)', () => {
  let app: INestApplication;
  const productsService = {
    listForUser: jest.fn(),
    getByIdForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
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

  it('GET /products returns user products', async () => {
    productsService.listForUser.mockResolvedValue([{ id: 'prd-1' }]);

    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect([{ id: 'prd-1' }]);
  });

  it('POST /products creates product with minimal payload', async () => {
    productsService.createForUser.mockResolvedValue({ id: 'prd-2' });

    await request(app.getHttpServer())
      .post('/products')
      .field('name', 'Produto')
      .field('salePrice', '10')
      .expect(201)
      .expect({ id: 'prd-2' });
  });
});
