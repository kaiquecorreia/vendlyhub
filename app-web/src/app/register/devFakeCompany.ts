import { establishmentTypes } from './schema';

type DevRegisterData = {
  userName: string;
  establishmentName: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  establishmentTypes: string[];
  email: string;
  phone_number: string;
  mobile_number: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  password: string;
  logo?: File | null;
};

type DevFakeCompanyResult = {
  payload: DevRegisterData;
  credentials: {
    email: string;
    password: string;
  };
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDigits = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 9).toString();
  }
  return result;
};

const generateValidCnpj = () => {
  const base = randomDigits(8) + '0001';

  const calcDigit = (numbers: string, weights: number[]) => {
    const sum = numbers
      .split('')
      .reduce((acc, num, idx) => acc + parseInt(num, 10) * weights[idx], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calcDigit(base, weights1);
  const digit2 = calcDigit(base + digit1.toString(), weights2);

  return base + digit1.toString() + digit2.toString();
};

export function generateDevFakeCompany(): DevFakeCompanyResult {
  const timestamp = Date.now();
  const randomSuffix = randomInt(1000, 9999);
  const establishmentSuffix = timestamp.toString().slice(-6);

  const email = `demo+${timestamp}${randomSuffix}@vendlyhub.local`;
  const password = 'Demo@12345';

  const selectedTypes = establishmentTypes.slice(0, 2);

  const document = generateValidCnpj();

  const payload: DevRegisterData = {
    userName: 'Usuário Demo',
    establishmentName: `Restaurante Sabor Demo ${establishmentSuffix}`,
    documentType: 'cnpj',
    document,
    establishmentTypes: selectedTypes,
    email,
    phone_number: '(11) 3333-4444',
    mobile_number: '(11) 98888-7777',
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 1',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    password,
    logo: null,
  };

  return {
    payload,
    credentials: {
      email,
      password,
    },
  };
}
