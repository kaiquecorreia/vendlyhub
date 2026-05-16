import { ClsService } from './cls.service';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
  })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

describe('PrismaService', () => {
  let service: PrismaService;
  let clsService: ClsService;

  beforeEach(() => {
    clsService = new ClsService();
    service = new PrismaService(clsService);
  });

  describe('getClient()', () => {
    it('retorna o cliente Prisma padrão quando não há transação no contexto', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('retorna o cliente transacional quando há transação no contexto', () => {
      const fakeTransaction = {
        isTransaction: true,
      } as unknown as PrismaClient['$transaction'];
      clsService.prismaTransaction.run(fakeTransaction, () => {
        const client = service.getClient();
        expect(client).toBe(fakeTransaction);
      });
    });
  });

  describe('onModuleDestroy()', () => {
    it('chama $disconnect e pool.end', async () => {
      const serviceAccess = service as unknown as {
        prisma: {
          $disconnect: jest.MockedFunction<() => Promise<void>>;
        };
        pool: {
          end: jest.MockedFunction<() => Promise<void>>;
        };
      };
      const prismaInstance = serviceAccess.prisma;
      const poolInstance = serviceAccess.pool;
      await service.onModuleDestroy();
      expect(prismaInstance.$disconnect).toHaveBeenCalled();
      expect(poolInstance.end).toHaveBeenCalled();
    });
  });

  describe('runInTransaction()', () => {
    it('chama $transaction no prisma e executa o callback', async () => {
      const serviceAccess = service as unknown as {
        prisma: {
          $transaction: jest.MockedFunction<
            (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
          >;
        };
      };
      const prismaInstance = serviceAccess.prisma;
      const fakeResult = { done: true };
      prismaInstance.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({ txClient: true });
        },
      );
      const fn = jest.fn().mockResolvedValue(fakeResult);
      const result = await service.runInTransaction(fn);
      expect(fn).toHaveBeenCalled();
      expect(result).toEqual(fakeResult);
    });
  });
});
