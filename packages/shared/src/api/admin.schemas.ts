import { z } from 'zod';

import { RoleSchema } from '../domain/enums.js';
import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';
import { PasswordSchema } from './auth.schemas.js';

const TrimmedNameSchema = z.string().trim().min(1).max(80);
const EntityIdSchema = z.uuid();

export const AreaSchema = z
  .object({
    id: EntityIdSchema,
    code: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    isProvisional: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const UserSchema = z
  .object({
    id: EntityIdSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    role: RoleSchema,
    area: AreaSchema.nullable(),
    position: z.string().nullable(),
    isActive: z.boolean(),
    mustChangePassword: z.boolean(),
    lastLoginAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const UserListQuerySchema = PaginationQuerySchema.extend({
  role: RoleSchema.optional(),
  isActive: z.stringbool().optional(),
}).strict();

export const CreateUserRequestSchema = z
  .object({
    firstName: TrimmedNameSchema,
    lastName: TrimmedNameSchema,
    email: z.email().max(254),
    role: RoleSchema,
    areaId: EntityIdSchema,
    position: z.string().trim().min(1).max(120).optional(),
    temporaryPassword: PasswordSchema,
  })
  .strict();

export const UpdateUserRequestSchema = CreateUserRequestSchema.omit({
  temporaryPassword: true,
})
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const UpdateUserStatusRequestSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const ResetUserPasswordRequestSchema = z
  .object({
    temporaryPassword: PasswordSchema,
  })
  .strict();

export const EntityIdParamsSchema = z.object({ id: EntityIdSchema }).strict();
export const UserResponseSchema = createApiSuccessSchema(UserSchema);
export const UserListResponseSchema = createApiSuccessSchema(
  z.array(UserSchema),
);

const AreaCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_]{2,30}$/, 'Use letras, números o guion bajo.');

export const AreaListQuerySchema = z
  .object({
    isActive: z.stringbool().optional(),
  })
  .strict();

export const CreateAreaRequestSchema = z
  .object({
    code: AreaCodeSchema,
    name: z.string().trim().min(1).max(100),
    isProvisional: z.boolean().default(true),
  })
  .strict();

export const UpdateAreaRequestSchema = z
  .object({
    code: AreaCodeSchema.optional(),
    name: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    isProvisional: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const AreaResponseSchema = createApiSuccessSchema(AreaSchema);
export const AreaListResponseSchema = createApiSuccessSchema(
  z.array(AreaSchema),
);

export type UserItem = z.infer<typeof UserSchema>;
export type UserListQuery = z.infer<typeof UserListQuerySchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUserStatusRequest = z.infer<
  typeof UpdateUserStatusRequestSchema
>;
export type ResetUserPasswordRequest = z.infer<
  typeof ResetUserPasswordRequestSchema
>;
export type AreaItem = z.infer<typeof AreaSchema>;
export type AreaListQuery = z.infer<typeof AreaListQuerySchema>;
export type CreateAreaRequest = z.infer<typeof CreateAreaRequestSchema>;
export type UpdateAreaRequest = z.infer<typeof UpdateAreaRequestSchema>;
