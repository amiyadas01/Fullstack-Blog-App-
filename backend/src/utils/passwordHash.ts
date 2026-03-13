import bcrypt from "bcrypt";
import crypto from "crypto";

// --- existing functions (keep as-is) ---
export const comparePassword = async (
  plain: string,
  hash: string
): Promise<boolean> => bcrypt.compare(plain, hash);

export const hashPassword = async (plain: string): Promise<string> =>
  bcrypt.hash(plain, 10);

// --- new: fast, non-bcrypt hash for tokens (tokens are already high-entropy) ---
/**
 * SHA-256 hash of a token string.
 * Use this instead of bcrypt for refresh tokens — they're already random/high-entropy
 * so a fast hash is secure and much cheaper than bcrypt.
 */
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Compare a raw token against a stored SHA-256 hash.
 */
export const compareToken = (token: string, storedHash: string): boolean =>
  crypto.createHash("sha256").update(token).digest("hex") === storedHash;