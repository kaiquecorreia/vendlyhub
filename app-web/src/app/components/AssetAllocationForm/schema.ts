import { z } from 'zod';

export const assetAllocationSchema = z.object({
  assets: z.array(
    z.object({
      type: z.string().min(1, 'Tipo de ativo é obrigatório'),
      percentage: z
        .number()
        .min(0, 'Percentual deve ser maior ou igual a 0')
        .max(100, 'Percentual deve ser menor ou igual a 100'),
    }),
  ),
});

export type AssetAllocation = z.infer<typeof assetAllocationSchema>;

export type Asset = {
  type: string;
  percentage: number;
};
