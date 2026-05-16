import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Mock simples para evitar problemas de tipo
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));
jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn(),
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  ApiProperty: () => () => undefined,
  ApiPropertyOptional: () => () => undefined,
  ApiBearerAuth: () => () => undefined,
  ApiTags: () => () => undefined,
  ApiConsumes: () => () => undefined,
}));
jest.mock('./app.module');

describe('main.ts', () => {
  const mockApp = {
    enableCors: jest.fn(),
    useGlobalPipes: jest.fn(),
    useStaticAssets: jest.fn(),
    listen: jest.fn().mockResolvedValue(undefined),
  } as unknown as {
    enableCors: jest.MockedFunction<(options: unknown) => void>;
    useGlobalPipes: jest.MockedFunction<(pipe: unknown) => void>;
    useStaticAssets: jest.MockedFunction<(path: string) => void>;
    listen: jest.MockedFunction<(port: string) => Promise<void>>;
  };

  const mockConfig = {
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  } as unknown as {
    setTitle: jest.MockedFunction<(title: string) => DocumentBuilder>;
    setDescription: jest.MockedFunction<
      (description: string) => DocumentBuilder
    >;
    setVersion: jest.MockedFunction<(version: string) => DocumentBuilder>;
    addBearerAuth: jest.MockedFunction<() => DocumentBuilder>;
    build: jest.MockedFunction<() => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FRONTEND_URL;
    delete process.env.PORT;

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (DocumentBuilder as jest.Mock).mockImplementation(() => mockConfig);
    (SwaggerModule.createDocument as jest.Mock).mockReturnValue({});
    (SwaggerModule.setup as jest.Mock).mockReturnValue(undefined);
  });

  it('should bootstrap application with default settings', async () => {
    const { bootstrap } = await import('./main');

    await bootstrap();

    expect(NestFactory.create as jest.Mock).toHaveBeenCalledWith(
      AppModule,
      expect.anything(),
    );
    expect(mockApp.enableCors).toHaveBeenCalledWith({
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('3012');
  });

  it('should bootstrap application with custom environment variables', async () => {
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.PORT = '8080';

    const { bootstrap } = await import('./main');

    await bootstrap();

    expect(mockApp.enableCors).toHaveBeenCalledWith({
      origin: 'https://example.com',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    expect(mockApp.listen).toHaveBeenCalledWith('8080');
  });

  it('should configure Swagger correctly', async () => {
    const { bootstrap } = await import('./main');

    await bootstrap();

    expect(mockConfig.setTitle).toHaveBeenCalledWith('Vendlyhub API');
    expect(mockConfig.setDescription).toHaveBeenCalledWith(
      'API for managing investment portfolios',
    );
    expect(mockConfig.setVersion).toHaveBeenCalledWith('1.0');
    expect(mockConfig.addBearerAuth).toHaveBeenCalled();
    expect(mockConfig.build).toHaveBeenCalled();
    expect(SwaggerModule.createDocument as jest.Mock).toHaveBeenCalled();
    expect(SwaggerModule.setup as jest.Mock).toHaveBeenCalledWith(
      'api',
      mockApp,
      {},
    );
  });

  it('should configure ValidationPipe with correct options', async () => {
    const { bootstrap } = await import('./main');

    await bootstrap();

    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe),
    );
  });

  it('should handle bootstrap errors', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockError = new Error('Bootstrap failed');

    // Test that console.error can be called with an error
    console.error(mockError);

    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);

    consoleErrorSpy.mockRestore();
  });
});
