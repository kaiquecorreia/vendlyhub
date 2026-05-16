import { z } from 'zod';
import { productWizardSchema } from '@/app/fast-onboarding/schema';

export const previewProductModalSchema = productWizardSchema.extend({
  stockQuantity: z.coerce
    .number({ invalid_type_error: 'Informe o estoque' })
    .int()
    .min(0, 'O estoque não pode ser negativo'),
});

export type PreviewProductModalFormData = z.infer<typeof previewProductModalSchema>;
