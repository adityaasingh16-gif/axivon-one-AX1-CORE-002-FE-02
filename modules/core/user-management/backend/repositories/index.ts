import type {
  AddMembershipInput,
  ISODateString,
  MembershipStatus,
  UpdateUserInput,
  UserListQuery,
  UserListResult,
  UserMembership,
  UserProfile,
  UserStatus,
  UUID,
} from '../contracts/index.js';

export interface CreateUserRecord {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  now: ISODateString;
  organizationIds: UUID[];
}

export interface UserRecord extends UserProfile {
  passwordHash: string;
}

export interface UserRepository {
  findById(id: UUID): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  list(query: UserListQuery): Promise<UserListResult>;
  create(input: CreateUserRecord): Promise<UserRecord>;
  update(id: UUID, input: UpdateUserInput, now: ISODateString): Promise<UserRecord | null>;
  updateStatus(id: UUID, status: UserStatus, now: ISODateString): Promise<UserRecord | null>;
  addMembership(
    userId: UUID,
    input: AddMembershipInput,
    now: ISODateString,
  ): Promise<UserMembership>;
  removeMembership(userId: UUID, organizationId: UUID, now: ISODateString): Promise<boolean>;
  listMemberships(userId: UUID): Promise<UserMembership[]>;
}

/** Input kept here to make the database adapter's supported statuses explicit. */
export type PersistedMembershipStatus = MembershipStatus;

/** Allows callers/tests to construct a profile without exposing password hashes. */
export const withoutPassword = (record: UserRecord): UserProfile => {
  const { passwordHash: _passwordHash, ...profile } = record;
  return profile;
};
