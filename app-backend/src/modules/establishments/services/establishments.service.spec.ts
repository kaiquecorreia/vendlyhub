import { EstablishmentsService } from './establishments.service';
import { Establishment } from '../entities/establishment.entity';
import { UserRole, DocumentType } from '@prisma/client';

const makeEstablishment = (
  overrides: Partial<Establishment> = {},
): Establishment => ({
  establishmentId: 'est-1',
  name: 'Test Restaurant',
  document: '12345678000199',
  documentType: DocumentType.cnpj,
  establishmentTypes: ['Restaurantes'],
  logo: null,
  addressId: 'addr-1',
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('EstablishmentsService', () => {
  let service: EstablishmentsService;
  let establishmentRepository: {
    create: jest.MockedFunction<(data: any) => Promise<any>>;
    findByEstablishmentId: jest.MockedFunction<(id: string) => Promise<any>>;
    findByUserId: jest.MockedFunction<(id: string) => Promise<any>>;
    update: jest.MockedFunction<(id: string, data: any) => Promise<any>>;
  };
  let userEstablishmentRepository: {
    create: jest.MockedFunction<(data: any) => Promise<void>>;
  };

  beforeEach(() => {
    establishmentRepository = {
      create: jest.fn(),
      findByEstablishmentId: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    userEstablishmentRepository = { create: jest.fn() };
    service = new EstablishmentsService(
      establishmentRepository,
      userEstablishmentRepository as any,
    );
  });

  describe('create()', () => {
    it('delega ao repositório e retorna o establishment criado', async () => {
      const est = makeEstablishment();
      establishmentRepository.create.mockResolvedValue(est);
      const data = {
        name: 'Test Restaurant',
        document: '12345678000199',
        documentType: DocumentType.cnpj,
        establishmentTypeNames: ['Restaurantes'],
        addressId: 'addr-1',
      };
      const result = await service.create(data);
      expect(establishmentRepository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(est);
    });
  });

  describe('findByEstablishmentId()', () => {
    it('retorna establishment quando encontrado', async () => {
      const est = makeEstablishment();
      establishmentRepository.findByEstablishmentId.mockResolvedValue(est);
      const result = await service.findByEstablishmentId('est-1');
      expect(result).toBe(est);
    });

    it('retorna null quando não encontrado', async () => {
      establishmentRepository.findByEstablishmentId.mockResolvedValue(null);
      const result = await service.findByEstablishmentId('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId()', () => {
    it('retorna establishment quando encontrado', async () => {
      const est = makeEstablishment();
      establishmentRepository.findByUserId.mockResolvedValue(est);
      const result = await service.findByUserId('user-1');
      expect(result).toBe(est);
    });

    it('retorna null quando não encontrado', async () => {
      establishmentRepository.findByUserId.mockResolvedValue(null);
      const result = await service.findByUserId('missing');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('delega ao repositório e retorna establishment atualizado', async () => {
      const updated = makeEstablishment({ name: 'Updated' });
      establishmentRepository.update.mockResolvedValue(updated);
      const result = await service.update('est-1', { name: 'Updated' });
      expect(establishmentRepository.update).toHaveBeenCalledWith('est-1', {
        name: 'Updated',
      });
      expect(result).toBe(updated);
    });
  });

  describe('linkUser()', () => {
    it('delega ao userEstablishmentRepository.create', async () => {
      userEstablishmentRepository.create.mockResolvedValue(undefined);
      await service.linkUser('user-1', 'est-1', UserRole.owner);
      expect(userEstablishmentRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        establishmentId: 'est-1',
        role: UserRole.owner,
      });
    });
  });
});
