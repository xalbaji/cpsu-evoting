import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: string;
}

export function createAccessToken(
  payload: TokenPayload,
): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "1d",
  });
}

export function verifyAccessToken(
  token: string,
): TokenPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret) as TokenPayload;
}