import { Request, Response } from "express";
import User from "../models/User.model";
import { generateUniqueUsername } from "../services/user.service";
import { convertToSlug } from "../../../utils/slugify";
import { hashPassword } from "../../../utils/passwordHash";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const baseUsername = convertToSlug(fullName);

    const username = await generateUniqueUsername(baseUsername);

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      fullName,
      email,
      username,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-passwordHash");

    return res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserPasswordByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select("passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.json({
      success: true,
      data: { passwordHash: user.passwordHash },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email }).select("passwordHash role _id");
};