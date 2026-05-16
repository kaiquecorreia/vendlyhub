import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { ClsService } from './cls.service';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private readonly prisma: PrismaClient;

  constructor(private readonly clsService: ClsService) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Prisma');

    await this.prisma.$disconnect();
    await this.pool.end();
  }

  getClient(): PrismaClient | Prisma.TransactionClient {
    const txClient = this.clsService.prismaTransaction.getStore();

    if (txClient) {
      return txClient;
    }

    return this.prisma;
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return this.clsService.prismaTransaction.run(tx, fn);
    });
  }
}
