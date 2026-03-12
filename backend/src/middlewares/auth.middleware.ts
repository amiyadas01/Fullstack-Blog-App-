import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues
      });
    }

    req.body = result.data;
    next();
  };