import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import { User } from '../entities/user.entity';
import {
  createMockUserRepository,
  MockUserRepository,
} from '../../../shared/types/test.types';

const makeUser = (overrides: Partial<User> = {}): User =>
  new User({
    userId: 'user-1',
    email: 'test@test.com',
    name: 'Test',
    passwordHash: 'hash',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockUserRepository;

  beforeEach(() => {
    repo = createMockUserRepository();
    service = new UsersService(repo);
  });

  describe('create()', () => {
    it('delega ao repositório e retorna o usuário criado', async () => {
      const user = makeUser();
      repo.create.mockResolvedValue(user);
      const result = await service.create({
        email: 'test@test.com',
        passwordHash: 'hash',
      });
      expect(repo.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        passwordHash: 'hash',
      });
      expect(result).toBe(user);
    });
  });

  describe('findByEmail()', () => {
    it('retorna o usuário quando encontrado', async () => {
      const user = makeUser();
      repo.findByEmail.mockResolvedValue(user);
      const result = await service.findByEmail('test@test.com');
      expect(result).toBe(user);
    });

    it('retorna null quando não encontrado', async () => {
      repo.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('none@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('retorna o usuário quando encontrado', async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);
      const result = await service.findById('user-1');
      expect(result).toBe(user);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update()', () => {
    it('delega ao repositório e retorna o usuário atualizado', async () => {
      const updated = makeUser({ name: 'Updated' });
      repo.update.mockResolvedValue(updated);
      const result = await service.update('user-1', { name: 'Updated' });
      expect(repo.update).toHaveBeenCalledWith('user-1', { name: 'Updated' });
      expect(result).toBe(updated);
    });
  });

  describe('updatePasswordHash()', () => {
    it('delega ao repositório com passwordHash', async () => {
      const updated = makeUser({ passwordHash: 'new-hash' });
      repo.update.mockResolvedValue(updated);
      const result = await service.updatePasswordHash('user-1', 'new-hash');
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hash',
      });
      expect(result).toBe(updated);
    });
  });

  describe('updateProfile()', () => {
    beforeEach(() => {
      jest.mocked(compare).mockReset();
      jest.mocked(hash).mockReset();
    });

    it('atualiza nome e email quando não há conflito', async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);
      repo.findByEmail.mockResolvedValue(null);
      const updated = makeUser({
        name: 'Novo',
        email: 'novo@test.com',
      });
      repo.update.mockResolvedValue(updated);
      const result = await service.updateProfile('user-1', {
        name: 'Novo',
        email: 'novo@test.com',
      });
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        name: 'Novo',
        email: 'novo@test.com',
      });
      expect(result).toBe(updated);
    });

    it('lança ConflictException quando email já pertence a outro usuário', async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);
      repo.findByEmail.mockResolvedValue(
        makeUser({ userId: 'other', email: 'outro@test.com' }),
      );
      await expect(
        service.updateProfile('user-1', { email: 'outro@test.com' }),
      ).rejects.toThrow(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('não chama update quando não há mudanças', async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);
      const result = await service.updateProfile('user-1', {});
      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it('atualiza senha quando senha atual é válida', async () => {
      const user = makeUser({ passwordHash: 'stored-hash' });
      repo.findById.mockResolvedValue(user);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(hash).mockResolvedValue('new-hash' as never);
      const updated = makeUser({ passwordHash: 'new-hash' });
      repo.update.mockResolvedValue(updated);
      const result = await service.updateProfile('user-1', {
        currentPassword: 'old',
        newPassword: 'newpass12',
      });
      expect(compare).toHaveBeenCalledWith('old', 'stored-hash');
      expect(hash).toHaveBeenCalledWith('newpass12', 10);
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hash',
      });
      expect(result).toBe(updated);
    });

    it('lança BadRequestException quando conta não tem senha para alterar', async () => {
      const user = makeUser({ passwordHash: '' });
      repo.findById.mockResolvedValue(user);
      await expect(
        service.updateProfile('user-1', {
          currentPassword: 'x',
          newPassword: 'newpass12',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando senha atual está incorreta', async () => {
      const user = makeUser({ passwordHash: 'stored-hash' });
      repo.findById.mockResolvedValue(user);
      jest.mocked(compare).mockResolvedValue(false as never);
      await expect(
        service.updateProfile('user-1', {
          currentPassword: 'wrong',
          newPassword: 'newpass12',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('atualiza avatar quando informado', async () => {
      const user = makeUser();
      const avatar = '/uploads/avatars/new-avatar.png';
      repo.findById.mockResolvedValue(user);

      const updated = makeUser({ avatar });
      repo.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', { avatar });
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        avatar,
      });
      expect(result).toBe(updated);
    });
  });
});
