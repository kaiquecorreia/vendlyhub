import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { UsersService } from './services/users.service';
import { USER_REPOSITORY } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma/prisma.user.repository';

@Module({
  providers: [
    PrismaService,
    ClsService,
    UsersService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
