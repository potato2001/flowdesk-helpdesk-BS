/** Output ports for capabilities that are not a data store. */

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenGenerator {
  /** An opaque, unguessable session token. */
  createToken(): string;
  /** Deterministic keyed digest used to store the token at rest. */
  hashToken(token: string): string;
  /** A unique id for naming stored files. */
  createId(): string;
}

export interface Clock {
  now(): Date;
}

export type StoredFile = {
  content: Uint8Array;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
};

export interface FileStorage {
  /** Writes exclusively — must reject if the key already exists. */
  write(storageKey: string, content: Uint8Array): Promise<void>;
  read(storageKey: string): Promise<Uint8Array>;
}

export type SessionCookie = {
  token: string;
  expiresAt: Date;
};

export interface SessionCookieStore {
  read(): Promise<string | null>;
  write(cookie: SessionCookie): Promise<void>;
  clear(): Promise<void>;
}
