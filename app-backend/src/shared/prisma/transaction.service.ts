import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClsService } from './cls.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly clsService: ClsService,
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const existing = this.clsService.prismaTransaction.getStore();
    if (existing) {
      return fn();
    }
    return this.prismaService.runInTransaction(fn);
  }
}
