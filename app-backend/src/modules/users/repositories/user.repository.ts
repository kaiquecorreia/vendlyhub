import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  name?: string;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  update(
    userId: string,
    data: Partial<
      Pick<
        User,
        | 'name'
        | 'avatar'
        | 'email'
        | 'isActive'
        | 'lastLoginAt'
        | 'passwordHash'
      >
    >,
  ): Promise<User>;
}
