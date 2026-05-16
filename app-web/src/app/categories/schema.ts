import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome da categoria é obrigatório')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'A descrição deve ter no máximo 500 caracteres').optional(),
  status: z.enum(['active', 'inactive']),
});

export type CategorySchemaType = z.infer<typeof categorySchema>;
