import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController (integration)', () => {
  let app: INestApplication;
  const catalogService = {
    getCatalog: jest.fn(),
    getHighlightedProducts: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: catalogService }],
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

  it('GET /catalog/:slug returns catalog payload', async () => {
    catalogService.getCatalog.mockResolvedValue({
      company: { id: 'est-1' },
      categories: [],
    });

    await request(app.getHttpServer())
      .get('/catalog/5511999998888')
      .expect(200)
      .expect({ company: { id: 'est-1' }, categories: [] });
  });

  it('GET /catalog/:slug/highlighted returns highlighted products', async () => {
    catalogService.getHighlightedProducts.mockResolvedValue([{ id: 'prod-1' }]);

    await request(app.getHttpServer())
      .get('/catalog/5511999998888/highlighted')
      .expect(200)
      .expect([{ id: 'prod-1' }]);
  });
});
