import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// Generic validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.params = result.data as any;
    next();
  };
}

// Common validation schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  cursor: z.string().optional(),
});

export const reportFiltersSchema = z.object({
  substance: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const friendRequestSchema = z.object({
  addresseeId: z.string().min(1, "Please select a user to send a request to"),
});

export const friendResponseSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "Status must be 'accepted' or 'rejected'" }),
  }),
});

export const onboardingSchema = z.object({
  step: z.number().int().min(0).max(5),
  completed: z.boolean().optional(),
});

export const tooltipSchema = z.object({
  tooltipId: z.string().min(1, "Invalid tooltip ID"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters").max(100),
});

export const reflectionSchema = z.object({
  periodType: z.enum(["week", "month"]),
  periodStart: z.string().datetime(),
  content: z.string().min(1, "Content must be a non-empty string").max(5000),
});

export const moodImportSchema = z.object({
  entries: z.array(
    z.object({
      date: z.string().optional(),
      level: z.coerce.number().int().min(1).max(5),
      notes: z.string().max(1000).optional(),
    })
  ).min(1, "No entries provided").max(1000),
});

export const channelMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

export const founderPostSchema = z.object({
  mediaUrl: z.string().min(1, "Media URL is required"),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().max(2200, "Caption too long").optional(),
});

export const reactionSchema = z.object({
  type: z.enum(["care", "solidarity", "strength", "insight", "gratitude"], {
    errorMap: () => ({ message: "Invalid reaction type" }),
  }),
});

export const reportUpdateSchema = z.object({
  substance: z.string().max(100).optional(),
  amount: z.string().max(100).optional(),
  setMindset: z.string().optional(),
  setting: z.string().optional(),
  experience: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
  isQuickLog: z.boolean().optional(),
  companionIds: z.array(z.string()).optional(),
  whatSurprised: z.string().optional(),
  lessonsToRemember: z.string().optional(),
  dailyLifeApplication: z.string().optional(),
  weeklyIntention: z.string().optional(),
  status: z.enum(["draft", "private", "shared"]).optional(),
  shareExpiresAt: z.string().datetime().nullable().optional(),
});
