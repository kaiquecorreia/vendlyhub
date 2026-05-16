import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do produto é obrigatório')
    .max(200, 'O nome deve ter no máximo 200 caracteres'),
  sku: z.string().min(1, 'O SKU é obrigatório').max(50, 'O SKU deve ter no máximo 50 caracteres'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  brand: z
    .string()
    .min(1, 'A marca é obrigatória')
    .max(100, 'A marca deve ter no máximo 100 caracteres'),
  model: z
    .string()
    .min(1, 'O modelo é obrigatório')
    .max(100, 'O modelo deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(1, 'A descrição é obrigatória')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres'),
  salePrice: z.number().min(0.01, 'O preço de venda deve ser maior que zero'),
  discount: z
    .number()
    .min(0, 'O desconto não pode ser negativo')
    .max(100, 'O desconto não pode ser maior que 100%'),
  cost: z.number().min(0, 'O custo não pode ser negativo'),
  unit: z.string().min(1, 'Selecione uma unidade de medida'),
  stockQuantity: z.number().int().min(0, 'A quantidade em estoque não pode ser negativa'),
  minStock: z.number().int().min(0, 'O estoque mínimo não pode ser negativo'),
  supplier: z
    .string()
    .min(1, 'O fornecedor é obrigatório')
    .max(200, 'O fornecedor deve ter no máximo 200 caracteres'),
  supplierCode: z
    .string()
    .max(50, 'O código do fornecedor deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  ean: z
    .string()
    .regex(/^(\d{8}|\d{13})?$/, 'O EAN deve ter 8 ou 13 dígitos')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  image: z.instanceof(File).optional().nullable(),
});

export type ProductSchemaType = z.infer<typeof productSchema>;
