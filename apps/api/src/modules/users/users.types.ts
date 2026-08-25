import type {
  CreateUserRequest,
  ResetUserPasswordRequest,
  Role,
  UpdateUserRequest,
  UserItem,
  UserListQuery,
} from '@sigecal/shared';

export interface UserRecord extends Omit<
  UserItem,
  'createdAt' | 'updatedAt' | 'lastLoginAt' | 'area'
> {
  readonly area:
    | (Omit<NonNullable<UserItem['area']>, 'createdAt' | 'updatedAt'> & {
        readonly createdAt: Date;
        readonly updatedAt: Date;
      })
    | null;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UserListResult {
  readonly items: readonly UserRecord[];
  readonly total: number;
}

export type UserSortField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'role'
  | 'createdAt'
  | 'lastLoginAt'
  | 'isActive';

export interface UserRepositoryPort {
  list(query: UserListQuery, sortBy: UserSortField): Promise<UserListResult>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  areaIsActive(id: string): Promise<boolean>;
  create(
    input: CreateUserRequest,
    passwordHash: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord>;
  update(
    id: string,
    input: UpdateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord>;
  setStatus(
    id: string,
    isActive: boolean,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord>;
  resetPassword(
    id: string,
    passwordHash: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
}

export interface UsersUseCases {
  list(
    query: UserListQuery,
  ): Promise<{ readonly data: readonly UserItem[]; readonly total: number }>;
  get(id: string): Promise<UserItem>;
  create(
    input: CreateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem>;
  update(
    id: string,
    input: UpdateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem>;
  setStatus(
    id: string,
    isActive: boolean,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem>;
  resetPassword(
    id: string,
    input: ResetUserPasswordRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
}

export const USER_SORT_FIELDS: readonly UserSortField[] = [
  'firstName',
  'lastName',
  'email',
  'role',
  'createdAt',
  'lastLoginAt',
  'isActive',
];
export type UserRole = Role;
