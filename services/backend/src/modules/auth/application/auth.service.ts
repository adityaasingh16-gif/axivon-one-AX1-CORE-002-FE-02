import {
  createUser,
  findUserByEmail,
findUserByIdentifier,
} from "../data/user.repository.js";
import { validateRegisterInput,validateLoginInput, } from "../validation/auth.validation.js";
import type { PasswordHasher } from "../security/password.js";
import type { TokenService } from "../security/token.js";

export async function registerUser(
  input: unknown,
  passwordHasher: PasswordHasher
) {
  const data = validateRegisterInput(input);

  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await passwordHasher.hash(data.password);

  const user = await createUser({
    email: data.email,
    username: data.username,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function loginUser(
  input: unknown,
  passwordHasher: PasswordHasher,
  tokenService: TokenService
) {
  const data = validateLoginInput(input);

  const user = await findUserByIdentifier(
    data.identifier
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordValid = await passwordHasher.verify(
    data.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid credentials");
  }

  if (user.status !== "active") {
    throw new Error("Invalid credentials");
  }

  const token = await tokenService.generate({
    userId: user.id,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      emailVerified: user.emailVerified,
    },
  };
}