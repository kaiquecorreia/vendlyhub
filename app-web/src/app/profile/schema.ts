import { z } from 'zod';

export const userProfileSchema = z
  .object({
    name: z.string(),
    email: z.string().min(1, 'O e-mail é obrigatório').email('Digite um e-mail válido'),
    avatar: z.instanceof(File).optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword || data.confirmPassword || data.currentPassword) {
      if (!data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Digite sua senha atual',
          path: ['currentPassword'],
        });
      }
      if (!data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Digite a nova senha',
          path: ['newPassword'],
        });
      } else if (data.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A nova senha deve ter no mínimo 8 caracteres',
          path: ['newPassword'],
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'As senhas não coincidem',
          path: ['confirmPassword'],
        });
      }
    }
  });

export type UserProfileFormData = z.infer<typeof userProfileSchema>;
