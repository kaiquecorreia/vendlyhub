import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../sessions/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => AuthenticatedRequest;
  };
}

describe('CategoriesController (integration)', () => {
  let app: INestApplication;
  const categoriesService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
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

  it('GET /categories returns user categories', async () => {
    categoriesService.listForUser.mockResolvedValue([{ id: 'cat-1' }]);

    await request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect([{ id: 'cat-1' }]);
    expect(categoriesService.listForUser).toHaveBeenCalledWith('user-1');
  });

  it('POST /categories creates category', async () => {
    categoriesService.createForUser.mockResolvedValue({ id: 'cat-2' });

    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Bebidas', status: 'active' })
      .expect(201)
      .expect({ id: 'cat-2' });
  });
});
