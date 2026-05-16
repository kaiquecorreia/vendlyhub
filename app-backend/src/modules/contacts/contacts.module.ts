import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { ContactsService } from './services/contacts.service';
import { CONTACT_REPOSITORY } from './repositories/contact.repository';
import { PrismaContactRepository } from './repositories/prisma/prisma.contact.repository';

@Module({
  providers: [
    PrismaService,
    ClsService,
    ContactsService,
    { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
  ],
  exports: [ContactsService],
})
export class ContactsModule {}
