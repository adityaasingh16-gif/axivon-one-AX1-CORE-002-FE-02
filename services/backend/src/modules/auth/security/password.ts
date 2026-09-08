import argon2 from "argon2";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verify(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}