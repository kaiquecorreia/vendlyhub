import { z } from 'zod';

export const productWizardSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do produto').max(160),
  salePrice: z.coerce
    .number({ invalid_type_error: 'Informe um preço válido' })
    .min(0, 'O preço não pode ser negativo'),
});

export type ProductWizardFormData = z.infer<typeof productWizardSchema>;
