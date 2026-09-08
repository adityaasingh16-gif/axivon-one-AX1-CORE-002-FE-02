export interface RegisterInput {
  email: string;
  password: string;
  username?: string;
}

export function validateRegisterInput(
  input: unknown
): RegisterInput {
  if (!input || typeof input !== "object") {
    throw new Error("Request body is required");
  }

  const body = input as Record<string, unknown>;

  if (
    typeof body.email !== "string" ||
    body.email.trim().length === 0
  ) {
    throw new Error("Email is required");
  }

  if (
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    throw new Error("Password must be at least 8 characters");
  }

  if (
    body.username !== undefined &&
    typeof body.username !== "string"
  ) {
    throw new Error("Username must be a string");
  }

  return {
    email: body.email.trim().toLowerCase(),
    password: body.password,
    username:
      typeof body.username === "string"
        ? body.username.trim()
        : undefined,
  };
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export function validateLoginInput(
  input: unknown
): LoginInput {
  if (!input || typeof input !== "object") {
    throw new Error("Request body is required");
  }

  const body = input as Record<string, unknown>;

  if (
    typeof body.identifier !== "string" ||
    body.identifier.trim().length === 0
  ) {
    throw new Error("Identifier is required");
  }

  if (
    typeof body.password !== "string" ||
    body.password.length === 0
  ) {
    throw new Error("Password is required");
  }

  return {
    identifier: body.identifier.trim().toLowerCase(),
    password: body.password,
  };
}