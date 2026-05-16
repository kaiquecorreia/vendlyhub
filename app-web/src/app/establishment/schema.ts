import { z } from 'zod';
import { establishmentTypes, validateCPF, validateCNPJ, validateCEP } from '../register/schema';

const establishmentTypeEnum = z.enum(establishmentTypes);

export const establishmentEditSchema = z
  .object({
    logo: z.instanceof(File).optional().nullable(),
    establishmentName: z.string().min(1, 'O nome do estabelecimento é obrigatório'),
    documentType: z.enum(['cpf', 'cnpj']),
    document: z.string().min(1, 'O documento é obrigatório'),
    establishmentTypes: z
      .array(establishmentTypeEnum)
      .min(1, 'Selecione ao menos um tipo de estabelecimento'),
    phone_number: z
      .string()
      .min(1, 'O telefone é obrigatório')
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Digite um telefone válido'),
    mobile_number: z
      .string()
      .min(1, 'O celular é obrigatório')
      .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, 'Digite um celular válido no formato (00) 00000-0000'),
    pixCopyPaste: z.string().max(2000, 'Código Pix muito longo').optional().or(z.literal('')),
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

export type EstablishmentEditFormData = z.infer<typeof establishmentEditSchema>;
