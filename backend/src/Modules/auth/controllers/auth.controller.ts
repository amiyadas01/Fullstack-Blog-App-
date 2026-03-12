import Session from "../models/session.model";
import { Request, Response } from "express";
import { comparePassword } from "../../../utils/passwordHash";
import { generateAccessToken, generateRefreshToken } from "../../../utils/jwt";
import { getUserPasswordByEmail } from "../../users/controllers/user.controller";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: any = await getUserPasswordByEmail(req, res);

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

    // Save the refresh token in the database
    const session = new Session({
      userId: user._id,
      token: refreshToken,
    });
    await session.save();

    return res.json({
      success: true,
      message: "Login successful",
      data: { accessToken, refreshToken },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
