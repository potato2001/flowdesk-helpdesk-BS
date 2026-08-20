import type { Role } from "./role";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  active: boolean;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  passwordChangedAt: Date;
  createdAt: Date;
};

/** Public projection — the shape safe to hand outward. */
export type UserProfile = Omit<User, "passwordHash">;

export function toProfile(user: User): UserProfile {
  const profile: Record<string, unknown> = { ...user };
  delete profile.passwordHash;
  return profile as UserProfile;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Initials used across the UI: last two words of the display name. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
