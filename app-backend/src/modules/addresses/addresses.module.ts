import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { AddressesService } from './services/addresses.service';
import { ADDRESS_REPOSITORY } from './repositories/address.repository';
import { PrismaAddressRepository } from './repositories/prisma/prisma.address.repository';

@Module({
  providers: [
    PrismaService,
    ClsService,
    AddressesService,
    { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
  ],
  exports: [AddressesService],
})
export class AddressesModule {}
