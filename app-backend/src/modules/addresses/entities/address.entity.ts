export class Address {
  addressId!: string;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;

  constructor(partial: Partial<Address>) {
    Object.assign(this, partial);
  }
}
