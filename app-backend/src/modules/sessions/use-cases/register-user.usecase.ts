import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { Prisma } from '@prisma/client';
import {
  OwnerType,
  UserRole,
  ContactType,
  AuthProviderType,
} from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';
import { RegisterMinimalDto } from '../dto/register-minimal.dto';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { AddressesService } from '../../addresses/services/addresses.service';
import { EstablishmentsService } from '../../establishments/services/establishments.service';
import { ContactsService } from '../../contacts/services/contacts.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { SessionsService } from '../services/sessions.service';
import { LoginWithTokenUseCase } from './login-with-token.usecase';
import { normalizeWhatsapp } from '../utils/normalize-whatsapp';

export interface RegisterUserResult {
  user: User;
  tokens?: { access_token: string; refresh_token: string };
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private usersService: UsersService,
    private addressesService: AddressesService,
    private establishmentsService: EstablishmentsService,
    private contactsService: ContactsService,
    private transactionService: TransactionService,
    private sessionsService: SessionsService,
    private loginWithTokenUseCase: LoginWithTokenUseCase,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterUserResult> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('Email já cadastrado');

    const passwordHash = await hash(dto.password || '', 10);

    return this.transactionService.run(async () => {
      let user: User;
      try {
        user = await this.usersService.create({
          email: dto.email,
          passwordHash,
          name: dto.name,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException('Email já cadastrado');
        }
        throw e;
      }

      await this.sessionsService.createProvider({
        userId: user.userId,
        provider: AuthProviderType.email,
        providerId: user.email,
      });

      const hasEstablishmentData =
        dto.establishmentName &&
        dto.documentType &&
        dto.document &&
        dto.establishmentTypes &&
        dto.establishmentTypes.length > 0;

      if (hasEstablishmentData) {
        const normalizedMobileNumber = dto.mobile_number
          ? normalizeWhatsapp(dto.mobile_number)
          : undefined;
        const address = await this.addressesService.create({
          cep: dto.cep,
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
        });

        const establishment = await this.establishmentsService.create({
          name: dto.establishmentName!,
          document: dto.document!,
          documentType: dto.documentType!,
          establishmentTypeNames: dto.establishmentTypes!,
          addressId: address.addressId,
          logo: dto.logo,
          pixCopyPaste: dto.pixCopyPaste,
          onboardingStatus: 'completed',
        });

        await this.establishmentsService.linkUser(
          user.userId,
          establishment.establishmentId,
          UserRole.owner,
        );

        if (dto.phone_number) {
          await this.contactsService.create({
            ownerType: OwnerType.establishment,
            ownerId: establishment.establishmentId,
            contactType: ContactType.phone_number,
            value: dto.phone_number,
            establishmentId: establishment.establishmentId,
          });
        }

        if (normalizedMobileNumber) {
          await this.contactsService.create({
            ownerType: OwnerType.establishment,
            ownerId: establishment.establishmentId,
            contactType: ContactType.mobile_number,
            value: normalizedMobileNumber,
            establishmentId: establishment.establishmentId,
          });
        }
      }

      let tokens: RegisterUserResult['tokens'];
      if (dto.password) {
        tokens = await this.loginWithTokenUseCase.execute(user);
      }

      return { user, tokens };
    });
  }

  async executeMinimal(dto: RegisterMinimalDto): Promise<RegisterUserResult> {
    const normalizedWhatsapp = normalizeWhatsapp(dto.whatsapp);
    if (!normalizedWhatsapp) {
      throw new BadRequestException('Whatsapp inválido');
    }

    const syntheticEmail = `wa_${normalizedWhatsapp}@vendlyhub.local`;
    const existingUser = await this.usersService.findByEmail(syntheticEmail);
    if (existingUser) throw new ConflictException('Whatsapp já cadastrado');

    const passwordHash = await hash(dto.password, 10);

    return this.transactionService.run(async () => {
      let user: User;
      try {
        user = await this.usersService.create({
          email: syntheticEmail,
          passwordHash,
          name: dto.establishmentName,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException('Whatsapp já cadastrado');
        }
        throw e;
      }

      await this.sessionsService.createProvider({
        userId: user.userId,
        provider: AuthProviderType.email,
        providerId: user.email,
      });

      const address = await this.addressesService.create({});
      const establishment = await this.establishmentsService.create({
        name: dto.establishmentName.trim(),
        addressId: address.addressId,
        logo: dto.logo,
        pixCopyPaste: dto.pixCopyPaste,
        onboardingStatus: 'minimal_completed',
      });

      await this.establishmentsService.linkUser(
        user.userId,
        establishment.establishmentId,
        UserRole.owner,
        {
          minimalProfileCompleted: true,
          loginWhatsapp: normalizedWhatsapp,
        },
      );

      await this.contactsService.create({
        ownerType: OwnerType.establishment,
        ownerId: establishment.establishmentId,
        contactType: ContactType.mobile_number,
        value: normalizedWhatsapp,
        establishmentId: establishment.establishmentId,
        isPrimary: true,
      });

      await this.establishmentsService.update(establishment.establishmentId, {
        onboardingStatus: 'minimal_completed',
      });

      const tokens = await this.loginWithTokenUseCase.execute(user);
      return { user, tokens };
    });
  }
}
