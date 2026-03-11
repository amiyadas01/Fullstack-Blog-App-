import { z } from "zod";

export const validate = async (schema: z.ZodType, data: unknown) => {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    return result.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
  }

  return null;
};
