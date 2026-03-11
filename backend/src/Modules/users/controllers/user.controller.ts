import User from "../models/User.model";
import { generateUniqueUsername } from "../services/user.service";
import { convertToSlug } from "../../../utils/slugify";
import { hashPassword } from "../../../utils/passwordHash";

interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
}

export const createUser = async (userData: CreateUserInput) => {
  const { fullName, email, password } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const baseUsername = convertToSlug(fullName);
  const userName = await generateUniqueUsername(baseUsername);

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    userName,
    passwordHash,
  });

  return user;
};

export const getAllUsers = async () => {
  return await User.find().select("-passwordHash");
};
