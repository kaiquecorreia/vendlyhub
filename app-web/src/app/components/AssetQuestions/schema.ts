import { z } from 'zod';

export const questionSchema = z.object({
  text: z.string().min(1, 'A pergunta é obrigatória'),
  weight: z
    .number()
    .min(0, 'A nota deve ser maior ou igual a 0')
    .max(10, 'A nota deve ser menor ou igual a 10'),
});

export const assetQuestionGroupSchema = z.object({
  assetType: z.string().min(1, 'O tipo de ativo é obrigatório'),
  questions: z.array(questionSchema),
});

export type QuestionFormData = z.infer<typeof questionSchema>;
export type AssetQuestionGroupFormData = z.infer<typeof assetQuestionGroupSchema>;
