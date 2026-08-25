import { z } from 'zod';

import { RoleSchema } from '../domain/enums.js';
import { PermissionSchema } from '../domain/permissions.js';
import { createApiSuccessSchema } from './contracts.js';

export const PasswordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra.')
  .regex(/[0-9]/, 'Debe incluir al menos un número.');

export const LoginRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1).max(128),
  })
  .strict();

export const UserSessionSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    role: RoleSchema,
    mustChangePassword: z.boolean(),
    permissions: z.array(PermissionSchema),
  })
  .strict();

export const LoginDataSchema = z
  .object({ accessToken: z.string().min(1), user: UserSessionSchema })
  .strict();
export const LoginResponseSchema = createApiSuccessSchema(LoginDataSchema);

export const RefreshDataSchema = z
  .object({ accessToken: z.string().min(1) })
  .strict();
export const RefreshResponseSchema = createApiSuccessSchema(RefreshDataSchema);

export const MeResponseSchema = createApiSuccessSchema(UserSessionSchema);

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: PasswordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual.',
    path: ['newPassword'],
  });

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
