import { Role, UserStatus } from '@eduflow/types';

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
}

export interface UserRepository {
  create: (input: CreateUserInput) => Promise<User>;
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  update: (id: string, input: UpdateUserInput) => Promise<User>;
  delete: (id: string) => Promise<void>;
}
