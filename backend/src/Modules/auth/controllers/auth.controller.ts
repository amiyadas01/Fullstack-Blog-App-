import Session from "../models/session.model";
import { Request, Response } from "express";
import { comparePassword, hashToken } from "../../../utils/passwordHash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../../../utils/jwt";
import { findUserByEmail } from "../../users/controllers/user.controller";
import { logger } from "../../../utils/logger";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id,
      role: user.role,
    });

    // Hash the refresh token before storing — never store raw tokens in DB
    const refreshTokenHash = hashToken(refreshToken);

    // Capture request metadata for the session
    const device = req.headers["user-agent"] ?? "unknown";
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const session = new Session({
      userId: user._id,
      refreshTokenHash,
      device,
      ipAddress,
      expiresAt,
    });

    await session.save();

    // Set refresh token as httpOnly cookie — client JS can never read it
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // blocks JS access (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict", // CSRF protection
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // in milliseconds
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken, // short-lived, safe to carry in memory / Authorization header
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// LOGOUT
// Reads the refresh token from the httpOnly cookie, deletes the matching
// session, then clears the cookie.
// ---------------------------------------------------------------------------
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || null;

    logger.info({
      message: "Refresh token from cookie",
      refreshToken,
      reqest:req,      
    });

    console.log("Refresh token from cookie:", refreshToken);

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    // Hash and find the session
    const incomingHash = hashToken(refreshToken);
    const session = await Session.findOne({ refreshTokenHash: incomingHash });

    if (session) {
      await Session.deleteOne({ _id: session._id });
    }

    // Clear the cookie regardless of whether a session was found
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// REFRESH ACCESS TOKEN  (token rotation)
// Reads refresh token from the httpOnly cookie, validates it, issues new
// tokens, rotates the session. Detects reuse and wipes all sessions if found.
// ---------------------------------------------------------------------------
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token found",
      });
    }

    // 1. Verify JWT signature and expiry (cheap, no DB hit)
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err: any) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Map your named error codes → readable client messages
      const messageMap: Record<string, string> = {
        REFRESH_TOKEN_EXPIRED: "Your session has expired. Please log in again.",
        REFRESH_TOKEN_INVALID: "Invalid refresh token.",
        REFRESH_TOKEN_VERIFICATION_FAILED: "Could not verify refresh token.",
      };

      return res.status(401).json({
        success: false,
        message: messageMap[err.message] ?? "Refresh token error.",
      });
    }

    // 2. Look up the session by hash
    const incomingHash = hashToken(refreshToken);
    const session = await Session.findOne({
      refreshTokenHash: incomingHash,
      userId: payload.userId,
    });

    if (!session) {
      // Valid JWT but not in DB → token was already rotated → reuse attack
      // Wipe all sessions for this user as breach response
      await Session.deleteMany({ userId: payload.userId });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(401).json({
        success: false,
        message:
          "Refresh token reuse detected. All sessions have been revoked.",
      });
    }

    // 3. Belt-and-suspenders expiry check on top of TTL index
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // 4. Issue new tokens
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      role: payload.role,
    });

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // 5. Rotate session in DB (old hash → new hash)
    await Session.findByIdAndUpdate(session._id, {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: newExpiresAt,
    });

    // 6. Rotate the cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
