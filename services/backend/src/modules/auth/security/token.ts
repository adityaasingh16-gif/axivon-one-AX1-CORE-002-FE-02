import crypto from "node:crypto";

export interface AuthTokenPayload {
  userId: string;
}

export interface TokenService {
  generate(payload: AuthTokenPayload): Promise<string>;
}

export class DevelopmentTokenService
  implements TokenService
{
  async generate(
    payload: AuthTokenPayload
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");

    console.warn(
      `Development auth token generated for user ${payload.userId}`
    );

    return token;
  }
}