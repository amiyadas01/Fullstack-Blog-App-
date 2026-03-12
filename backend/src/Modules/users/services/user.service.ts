import User from "../models/User.model";

const MAX_ATTEMPTS = 20;

export const generateUniqueUsername = async (
  baseUsername: string,
): Promise<string> => {
  const taken = await User.find(
    { username: { $regex: `^${baseUsername}(\\d+)?$` } },
    { username: 1, _id: 0 },
  ).lean();

  const takenSet = new Set(taken.map((u) => u.username));

  if (!takenSet.has(baseUsername)) return baseUsername;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const candidate = `${baseUsername}${i}`;
    if (!takenSet.has(candidate)) return candidate;
  }

  return `${baseUsername}_${Date.now()}`;
};
