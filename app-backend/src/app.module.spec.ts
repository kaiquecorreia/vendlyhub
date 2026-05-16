import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { SessionsModule } from './modules/sessions/sessions.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    if (module && typeof module.close === 'function') {
      try {
        await module.close();
      } catch {
        // Ignore close errors
      }
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import UsersModule', () => {
    const usersModule = module.get<UsersModule>(UsersModule);
    expect(usersModule).toBeDefined();
  });

  it('should import AddressesModule', () => {
    const addressesModule = module.get<AddressesModule>(AddressesModule);
    expect(addressesModule).toBeDefined();
  });

  it('should import ContactsModule', () => {
    const contactsModule = module.get<ContactsModule>(ContactsModule);
    expect(contactsModule).toBeDefined();
  });

  it('should import EstablishmentsModule', () => {
    const establishmentsModule =
      module.get<EstablishmentsModule>(EstablishmentsModule);
    expect(establishmentsModule).toBeDefined();
  });

  it('should import SessionsModule', () => {
    const sessionsModule = module.get<SessionsModule>(SessionsModule);
    expect(sessionsModule).toBeDefined();
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(AppModule);
    expect(moduleRef).toBeDefined();
    expect(moduleRef).toBeInstanceOf(AppModule);
  });

  it('should not have any controllers', () => {
    const controllers: any[] =
      Reflect.getMetadata('controllers', AppModule) || [];
    expect(controllers).toEqual([]);
  });

  it('should not have any providers', () => {
    const providers: any[] = Reflect.getMetadata('providers', AppModule) || [];
    expect(providers).toEqual([]);
  });

  it('should have correct imports in module metadata', () => {
    const imports: any[] = Reflect.getMetadata('imports', AppModule) || [];
    expect(imports).toContain(UsersModule);
    expect(imports).toContain(AddressesModule);
    expect(imports).toContain(ContactsModule);
    expect(imports).toContain(EstablishmentsModule);
    expect(imports).toContain(SessionsModule);
  });
});
