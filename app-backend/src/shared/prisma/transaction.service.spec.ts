import { TransactionService } from './transaction.service';
import { PrismaService } from './prisma.service';
import { ClsService } from './cls.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: { runInTransaction: jest.Mock };
  let clsService: { prismaTransaction: { getStore: jest.Mock } };

  beforeEach(() => {
    prismaService = { runInTransaction: jest.fn() };
    clsService = { prismaTransaction: { getStore: jest.fn() } };
    service = new TransactionService(
      prismaService as unknown as PrismaService,
      clsService as unknown as ClsService,
    );
  });

  it('chama runInTransaction quando não há transação ativa no contexto', async () => {
    clsService.prismaTransaction.getStore.mockReturnValue(undefined);
    const fakeResult = { ok: true };
    prismaService.runInTransaction.mockResolvedValue(fakeResult);
    const fn = jest.fn().mockResolvedValue(fakeResult);
    const result = await service.run(fn);
    expect(prismaService.runInTransaction).toHaveBeenCalledWith(fn);
    expect(result).toEqual(fakeResult);
  });

  it('reutiliza transação existente e chama fn() diretamente', async () => {
    const existingTx = { tx: true };
    clsService.prismaTransaction.getStore.mockReturnValue(existingTx);
    const fakeResult = { reused: true };
    const fn = jest.fn().mockResolvedValue(fakeResult);
    const result = await service.run(fn);
    expect(prismaService.runInTransaction).not.toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
    expect(result).toEqual(fakeResult);
  });

  it('propaga o valor retornado pelo callback', async () => {
    clsService.prismaTransaction.getStore.mockReturnValue(undefined);
    const expected = 42;
    prismaService.runInTransaction.mockImplementation(
      (fn: () => Promise<number>) => fn(),
    );
    const fn = jest.fn().mockResolvedValue(expected);
    const result = await service.run(fn);
    expect(result).toBe(expected);
  });
});
