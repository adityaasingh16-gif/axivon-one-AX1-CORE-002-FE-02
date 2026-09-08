import { Request, Response } from "express";
import {
  registerUser,loginUser,
} from "../application/auth.service.js";
import {
  Argon2PasswordHasher,
} from "../security/password.js";
import {
  DevelopmentTokenService,
} from "../security/token.js";

const passwordHasher = new Argon2PasswordHasher();

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = await registerUser(
      req.body,
      passwordHasher
    );

    res.status(201).json({
      data: {
        user,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to register user";

    if (message === "User already exists") {
      res.status(409).json({
        error: {
          code: "USER_ALREADY_EXISTS",
          message,
        },
      });

      return;
    }

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    });
  }
}
const tokenService = new DevelopmentTokenService();

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await loginUser(
      req.body,
      passwordHasher,
      tokenService
    );

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to login";

    if (message === "Invalid credentials") {
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      });

      return;
    }

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    });
  }
}