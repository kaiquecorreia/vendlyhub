export class AuthProvider {
  authProviderId!: string;
  userId!: string;
  provider!: string;
  providerId!: string;
  createdAt!: Date;

  constructor(partial: Partial<AuthProvider>) {
    Object.assign(this, partial);
  }
}
