import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  IEstablishmentRepository,
  CreateEstablishmentData,
  UpdateEstablishmentData,
} from '../establishment.repository';
import { Establishment } from '../../entities/establishment.entity';

const establishmentWithTypesInclude = {
  establishmentEstablishmentTypes: {
    include: { establishmentType: true },
  },
} as const;

function isRootPrismaClient(
  client: PrismaClient | Prisma.TransactionClient,
): client is PrismaClient {
  return typeof (client as PrismaClient).$transaction === 'function';
}

type EstablishmentWithTypes = {
  establishmentId: string;
  name: string;
  document: string | null;
  documentType: string | null;
  onboardingStatus: 'draft' | 'minimal_completed' | 'completed';
  pixCopyPaste: string | null;
  logo: string | null;
  addressId: string;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  establishmentEstablishmentTypes: {
    establishmentType: { name: string };
  }[];
};

@Injectable()
export class PrismaEstablishmentRepository implements IEstablishmentRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private mapToDomain(e: EstablishmentWithTypes): Establishment {
    const establishmentTypes = e.establishmentEstablishmentTypes.map(
      (row) => row.establishmentType.name,
    );
    return new Establishment({
      establishmentId: e.establishmentId,
      name: e.name,
      document: e.document,
      documentType: e.documentType,
      onboardingStatus: e.onboardingStatus,
      establishmentTypes,
      pixCopyPaste: e.pixCopyPaste,
      logo: e.logo,
      addressId: e.addressId,
      isActive: e.isActive,
      deletedAt: e.deletedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  }

  async create(data: CreateEstablishmentData): Promise<Establishment> {
    const { establishmentTypeNames: rawNames = [], ...base } = data;
    const establishmentTypeNames = [...new Set(rawNames)];
    const establishment = await this.prisma.establishment.create({
      data: {
        name: base.name,
        document: base.document,
        documentType: base.documentType,
        onboardingStatus: base.onboardingStatus,
        pixCopyPaste: base.pixCopyPaste,
        addressId: base.addressId,
        logo: base.logo,
        ...(establishmentTypeNames.length > 0
          ? {
              establishmentEstablishmentTypes: {
                create: establishmentTypeNames.map((name) => ({
                  establishmentType: { connect: { name } },
                })),
              },
            }
          : {}),
      },
      include: establishmentWithTypesInclude,
    });
    return this.mapToDomain(establishment);
  }

  async findByEstablishmentId(
    establishmentId: string,
  ): Promise<Establishment | null> {
    const establishment = await this.prisma.establishment.findUnique({
      where: { establishmentId },
      include: establishmentWithTypesInclude,
    });
    return establishment ? this.mapToDomain(establishment) : null;
  }

  async findByUserId(userId: string): Promise<Establishment | null> {
    const record = await this.prisma.userEstablishment.findFirst({
      where: { userId },
      include: {
        establishment: {
          include: establishmentWithTypesInclude,
        },
      },
    });
    return record?.establishment
      ? this.mapToDomain(record.establishment)
      : null;
  }

  async update(
    establishmentId: string,
    data: UpdateEstablishmentData,
  ): Promise<Establishment> {
    const { establishmentTypeNames: rawNames, ...rest } = data;

    if (rawNames !== undefined) {
      const establishmentTypeNames = [...new Set(rawNames)];
      if (establishmentTypeNames.length === 0) {
        throw new BadRequestException(
          'At least one establishment type is required',
        );
      }
      const client = this.prismaService.getClient();

      const applyTypeChanges = async (tx: Prisma.TransactionClient) => {
        await tx.establishment.update({
          where: { establishmentId },
          data: rest,
        });
        const types = await tx.establishmentType.findMany({
          where: { name: { in: establishmentTypeNames } },
        });
        if (types.length !== establishmentTypeNames.length) {
          throw new BadRequestException('Invalid establishment type names');
        }
        await tx.establishmentEstablishmentType.deleteMany({
          where: { establishmentId },
        });
        await tx.establishmentEstablishmentType.createMany({
          data: types.map((t) => ({
            establishmentId,
            establishmentTypeId: t.establishmentTypeId,
          })),
        });
      };

      // Root PrismaClient has $transaction; interactive tx client from CLS does not.
      if (isRootPrismaClient(client)) {
        await client.$transaction(applyTypeChanges);
      } else {
        await applyTypeChanges(client);
      }
    } else {
      await this.prisma.establishment.update({
        where: { establishmentId },
        data: rest,
      });
    }

    const reloaded = await this.prisma.establishment.findUnique({
      where: { establishmentId },
      include: establishmentWithTypesInclude,
    });
    if (!reloaded) {
      throw new BadRequestException('Establishment not found');
    }
    return this.mapToDomain(reloaded);
  }
}
