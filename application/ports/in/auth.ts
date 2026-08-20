import type { SessionUserDTO } from "../../dto/user.dto";
import type { User } from "@/domain/user/user";
import type { Role } from "@/domain/user/role";

export type LoginInput = {
  email: string;
  password: string;
  ipAddress: string | null;
};

export interface LoginUseCase {
  execute(input: LoginInput): Promise<SessionUserDTO>;
}

export interface LogoutUseCase {
  execute(): Promise<void>;
}

/**
 * Resolves the caller from the session cookie. Returns the full domain user
 * because downstream use cases need the password hash and lock state.
 */
export interface AuthenticateUseCase {
  currentUser(): Promise<User | null>;
  requireUser(roles?: readonly Role[]): Promise<User>;
}

export type ChangePasswordInput = {
  actor: User;
  currentPassword: string;
  newPassword: string;
  ipAddress: string | null;
};

export interface ChangePasswordUseCase {
  execute(input: ChangePasswordInput): Promise<void>;
}
