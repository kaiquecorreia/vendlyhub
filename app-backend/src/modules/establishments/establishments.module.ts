import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { EstablishmentsService } from './services/establishments.service';
import { ESTABLISHMENT_REPOSITORY } from './repositories/establishment.repository';
import { USER_ESTABLISHMENT_REPOSITORY } from './repositories/user-establishment.repository';
import { PrismaEstablishmentRepository } from './repositories/prisma/prisma.establishment.repository';
import { PrismaUserEstablishmentRepository } from './repositories/prisma/prisma.user-establishment.repository';

@Module({
  providers: [
    PrismaService,
    ClsService,
    EstablishmentsService,
    {
      provide: ESTABLISHMENT_REPOSITORY,
      useClass: PrismaEstablishmentRepository,
    },
    {
      provide: USER_ESTABLISHMENT_REPOSITORY,
      useClass: PrismaUserEstablishmentRepository,
    },
  ],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
