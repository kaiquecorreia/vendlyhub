import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    UsersModule,
    AddressesModule,
    ContactsModule,
    EstablishmentsModule,
    SessionsModule,
    CategoriesModule,
    ProductsModule,
    CatalogModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
