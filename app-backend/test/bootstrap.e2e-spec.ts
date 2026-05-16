import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';

describe('Bootstrap Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create application successfully', () => {
    expect(app).toBeDefined();
  });

  it('should have HTTP server running', () => {
    expect(app.getHttpServer()).toBeDefined();
  });

  it('should be able to close application gracefully', async () => {
    await expect(app.close()).resolves.not.toThrow();
  });
});
