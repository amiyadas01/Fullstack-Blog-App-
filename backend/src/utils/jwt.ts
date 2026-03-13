// src/utils/jwt.util.ts
import jwt, { SignOptions } from "jsonwebtoken";

// ─── Config ────────────────────────────────────────────────────────────────────
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// two separate secrets — if one leaks, other is still safe
// never use same secret for both tokens

// ─── Payload type ──────────────────────────────────────────────────────────────
export interface TokenPayload {
  userId: Object;
  role: string;
}

// ─── Generate Access Token ─────────────────────────────────────────────────────
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m", // short lived — if stolen, expires fast
    algorithm: "HS256",
  } as SignOptions);
};

// ─── Generate Refresh Token ────────────────────────────────────────────────────
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d", // long lived — stored in httpOnly cookie
    algorithm: "HS256",
  } as SignOptions);
};

// ─── Verify Access Token ───────────────────────────────────────────────────────
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch (err: any) {
    // normalize all jwt errors into readable messages
    if (err.name === "TokenExpiredError")
      throw new Error("ACCESS_TOKEN_EXPIRED");
    if (err.name === "JsonWebTokenError")
      throw new Error("ACCESS_TOKEN_INVALID");
    throw new Error("ACCESS_TOKEN_VERIFICATION_FAILED");
  }
};

// ─── Verify Refresh Token ──────────────────────────────────────────────────────
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError")
      throw new Error("REFRESH_TOKEN_EXPIRED");
    if (err.name === "JsonWebTokenError")
      throw new Error("REFRESH_TOKEN_INVALID");
    throw new Error("REFRESH_TOKEN_VERIFICATION_FAILED");
  }
};
