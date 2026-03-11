import User from "../models/User.model";

const checkUsernameExists = async (username: string) => {
  const existingUser = await User.findOne({ username });
  return !!existingUser;
};

export const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
  let username = baseUsername;
  let suffix = 1;

  while (await checkUsernameExists(username)) {
    username = `${baseUsername}${suffix}`;
    suffix++;
  }

  return username;
};
