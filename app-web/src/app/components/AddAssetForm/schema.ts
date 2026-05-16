import { z } from 'zod';

export const assetFormSchema = z.object({
  type: z.string().min(1, 'Tipo de ativo é obrigatório'),
  transactionType: z.enum(['buy', 'sell']),
  asset: z.string().min(1, 'Código do ativo é obrigatório'),
  purchaseDate: z.string().min(1, 'Data é obrigatória'),
  quantity: z
    .number()
    .min(0.000000001, 'Quantidade deve ser maior que 0')
    .max(999999999, 'Quantidade muito alta'),
  price: z.number().min(0, 'Preço deve ser maior que 0'),
  totalValue: z.number(),
  isManualPrice: z.boolean(),
  questions: z.array(
    z.object({
      text: z.string(),
      isChecked: z.boolean(),
    }),
  ),
});

export type AssetFormData = z.infer<typeof assetFormSchema>;
