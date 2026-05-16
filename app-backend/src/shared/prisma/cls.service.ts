import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const prismaTransactionLocalStorage =
  new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class ClsService {
  public readonly prismaTransaction: typeof prismaTransactionLocalStorage;

  constructor() {
    this.prismaTransaction = prismaTransactionLocalStorage;
  }
}
