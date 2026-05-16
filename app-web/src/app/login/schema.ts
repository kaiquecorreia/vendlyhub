import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Informe seu WhatsApp ou e-mail'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória')
    .min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
