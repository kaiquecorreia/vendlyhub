import { ContactsService } from './contacts.service';
import { Contact } from '../entities/contact.entity';
import {
  createMockContactRepository,
  MockContactRepository,
} from '../../../shared/types/test.types';
import { OwnerType, ContactType } from '@prisma/client';

const makeContact = (overrides: Partial<Contact> = {}): Contact =>
  new Contact({
    contactId: 'contact-1',
    ownerType: OwnerType.establishment,
    ownerId: 'est-1',
    contactType: ContactType.phone_number,
    value: '+5511999999999',
    label: null,
    isPrimary: false,
    userId: null,
    establishmentId: 'est-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('ContactsService', () => {
  let service: ContactsService;
  let contactRepository: MockContactRepository;

  beforeEach(() => {
    contactRepository = createMockContactRepository();
    service = new ContactsService(contactRepository as any);
  });

  describe('create()', () => {
    it('delega ao repositório e retorna o contato criado', async () => {
      const contact = makeContact();
      contactRepository.create.mockResolvedValue(contact);
      const data = {
        ownerType: OwnerType.establishment,
        ownerId: 'est-1',
        contactType: ContactType.phone_number,
        value: '+5511999999999',
        establishmentId: 'est-1',
      };
      const result = await service.create(data);
      expect(contactRepository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(contact);
    });

    it('normaliza mobile_number para dígitos ao criar contato', async () => {
      const contact = makeContact({
        contactType: ContactType.mobile_number,
        value: '5511999998888',
      });
      contactRepository.create.mockResolvedValue(contact);

      await service.create({
        ownerType: OwnerType.establishment,
        ownerId: 'est-1',
        contactType: ContactType.mobile_number,
        value: '+55 (11) 99999-8888',
        establishmentId: 'est-1',
      });

      expect(contactRepository.create).toHaveBeenCalledWith({
        ownerType: OwnerType.establishment,
        ownerId: 'est-1',
        contactType: ContactType.mobile_number,
        value: '5511999998888',
        establishmentId: 'est-1',
      });
    });
  });

  describe('findByOwnerId()', () => {
    it('retorna lista de contatos', async () => {
      const contacts = [makeContact()];
      contactRepository.findByOwnerId.mockResolvedValue(contacts);
      const result = await service.findByOwnerId(
        'est-1',
        OwnerType.establishment,
      );
      expect(contactRepository.findByOwnerId).toHaveBeenCalledWith(
        'est-1',
        OwnerType.establishment,
      );
      expect(result).toEqual(contacts);
    });

    it('retorna lista vazia quando não há contatos', async () => {
      contactRepository.findByOwnerId.mockResolvedValue([]);
      const result = await service.findByOwnerId('none', OwnerType.user);
      expect(result).toEqual([]);
    });
  });

  describe('upsertEstablishmentContacts()', () => {
    it('normaliza mobile_number para dígitos ao atualizar', async () => {
      const existing = makeContact({
        contactId: 'mobile-contact',
        contactType: ContactType.mobile_number,
        value: '5511988887777',
      });
      contactRepository.findByOwnerId.mockResolvedValue([existing]);
      contactRepository.update.mockResolvedValue(existing);

      await service.upsertEstablishmentContacts(
        'est-1',
        undefined,
        '+55 (11) 99999-8888',
      );

      expect(contactRepository.update).toHaveBeenCalledWith('mobile-contact', {
        value: '5511999998888',
      });
    });
  });
});
