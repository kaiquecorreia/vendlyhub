import { z } from 'zod';

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  return true;
};

export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

/** Labels must match backend seed (`establishment_type.name`). */
export const establishmentTypes = [
  'Restaurantes',
  'Pizzarias',
  'Hamburguerias',
  'Comida brasileira',
  'Comida japonesa / oriental',
  'Comida italiana',
  'Comida árabe',
  'Comida mexicana',
  'Comida chinesa',
  'Comida saudável / fit',
  'Marmitas',
  'Padarias',
  'Confeitarias',
  'Docerias',
  'Sorveterias',
  'Lojas de açaí',
  'Cafeterias',
  'Casas de sucos',
  'Bares (com regras para bebidas alcoólicas)',
  'Lanchonetes',
  'Pastelarias',
  'Creperias',
  'Food trucks',
  'Cozinhas virtuais (dark kitchens)',
  'Mercados',
  'Minimercados',
  'Hortifrúti',
  'Lojas de conveniência',
  'Empórios',
  'Adegas',
  'Farmácias',
  'Pet shops',
] as const;

const establishmentTypeEnum = z.enum(establishmentTypes);

export const registerSchema = z
  .object({
    logo: z.instanceof(File).optional().nullable(),
    userName: z.string().min(2, 'Informe seu nome completo'),
    establishmentName: z.string().min(1, 'O nome do estabelecimento é obrigatório'),
    documentType: z.enum(['cpf', 'cnpj']),
    document: z.string().min(1, 'O documento é obrigatório'),
    establishmentTypes: z
      .array(establishmentTypeEnum)
      .min(1, 'Selecione ao menos um tipo de estabelecimento'),
    email: z.string().min(1, 'O e-mail é obrigatório').email('Digite um e-mail válido'),
    phone_number: z
      .string()
      .min(1, 'O telefone é obrigatório')
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Digite um telefone válido'),
    mobile_number: z
      .string()
      .min(1, 'O celular é obrigatório')
      .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, 'Digite um celular válido no formato (00) 00000-0000'),
    cep: z
      .string()
      .min(1, 'O CEP é obrigatório')
      .refine((val) => validateCEP(val), {
        message: 'Digite um CEP válido',
      }),
    street: z.string().min(1, 'A rua é obrigatória'),
    number: z.string().min(1, 'O número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'O bairro é obrigatório'),
    city: z.string().min(1, 'A cidade é obrigatória'),
    state: z.string().min(1, 'O estado é obrigatório').length(2, 'Use a sigla do estado (ex: SP)'),
    password: z
      .string()
      .min(1, 'A senha é obrigatória')
      .min(8, 'A senha deve ter no mínimo 8 caracteres'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Você precisa aceitar os termos de uso e política de privacidade',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.documentType === 'cpf') {
      if (!validateCPF(data.document)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF inválido',
          path: ['document'],
        });
      }
    } else {
      if (!validateCNPJ(data.document)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CNPJ inválido',
          path: ['document'],
        });
      }
    }
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
