import { Injectable, Inject } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IEstablishmentRepository,
  ESTABLISHMENT_REPOSITORY,
  CreateEstablishmentData,
  UpdateEstablishmentData,
} from '../repositories/establishment.repository';
import {
  IUserEstablishmentRepository,
  USER_ESTABLISHMENT_REPOSITORY,
} from '../repositories/user-establishment.repository';
import { Establishment } from '../entities/establishment.entity';

@Injectable()
export class EstablishmentsService {
  constructor(
    @Inject(ESTABLISHMENT_REPOSITORY)
    private establishmentRepository: IEstablishmentRepository,
    @Inject(USER_ESTABLISHMENT_REPOSITORY)
    private userEstablishmentRepository: IUserEstablishmentRepository,
  ) {}

  async create(data: CreateEstablishmentData): Promise<Establishment> {
    return this.establishmentRepository.create(data);
  }

  async findByEstablishmentId(
    establishmentId: string,
  ): Promise<Establishment | null> {
    return this.establishmentRepository.findByEstablishmentId(establishmentId);
  }

  async findByUserId(userId: string): Promise<Establishment | null> {
    return this.establishmentRepository.findByUserId(userId);
  }

  async update(
    establishmentId: string,
    data: UpdateEstablishmentData,
  ): Promise<Establishment> {
    return this.establishmentRepository.update(establishmentId, data);
  }

  async linkUser(
    userId: string,
    establishmentId: string,
    role: UserRole,
    options?: { loginWhatsapp?: string; minimalProfileCompleted?: boolean },
  ): Promise<void> {
    return this.userEstablishmentRepository.create({
      userId,
      establishmentId,
      role,
      loginWhatsapp: options?.loginWhatsapp,
      minimalProfileCompleted: options?.minimalProfileCompleted,
    });
  }
}
