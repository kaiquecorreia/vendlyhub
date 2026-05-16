import { Exclude } from 'class-transformer';

export class User {
  userId!: string;
  email!: string;
  name?: string | null;
  avatar?: string | null;
  isActive!: boolean;
  lastLoginAt?: Date | null;

  @Exclude()
  passwordHash?: string | null;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
