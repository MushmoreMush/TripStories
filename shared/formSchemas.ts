// Shared form validation schemas for TripStories
// Used by both client-side forms and server-side validation

import { z } from "zod";
import { SUBSTANCES, REPORT_STATUSES, MOOD_LEVELS } from "./constants";

// Trip Report form schema - used for creating/editing reports
export const tripReportFormSchema = z.object({
  substance: z.string().min(1, "Please select a substance"),
  amount: z.string().min(1, "Please enter an amount"),
  setMindset: z.string().min(10, "Please describe your mindset (at least 10 characters)"),
  setting: z.string().min(10, "Please describe your setting (at least 10 characters)"),
  experience: z.string().min(50, "Please describe your experience (at least 50 characters)"),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
  isQuickLog: z.boolean().optional(),
  companionIds: z.array(z.string()).optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  shareExpiresAt: z.string().datetime().nullable().optional(),
  // Integration prompts
  whatSurprised: z.string().optional(),
  lessonsToRemember: z.string().optional(),
  dailyLifeApplication: z.string().optional(),
  weeklyIntention: z.string().optional(),
});

export type TripReportFormValues = z.infer<typeof tripReportFormSchema>;

// Basic report form schema (without integration prompts)
export const basicReportFormSchema = z.object({
  substance: z.string().min(1, "Please select a substance"),
  amount: z.string().min(1, "Please enter an amount"),
  setMindset: z.string().min(10, "Please describe your mindset (at least 10 characters)"),
  setting: z.string().min(10, "Please describe your setting (at least 10 characters)"),
  experience: z.string().min(50, "Please describe your experience (at least 50 characters)"),
});

export type BasicReportFormValues = z.infer<typeof basicReportFormSchema>;

// Integration data schema
export const integrationDataSchema = z.object({
  whatSurprised: z.string().optional(),
  lessonsToRemember: z.string().optional(),
  dailyLifeApplication: z.string().optional(),
  weeklyIntention: z.string().optional(),
});

export type IntegrationDataValues = z.infer<typeof integrationDataSchema>;

// Mood entry form schema
export const moodEntryFormSchema = z.object({
  level: z.number().min(1).max(5, "Mood level must be between 1 and 5"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

export type MoodEntryFormValues = z.infer<typeof moodEntryFormSchema>;

// Comment form schema
export const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
  parentId: z.number().optional(),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

// Channel message form schema
export const channelMessageFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export type ChannelMessageFormValues = z.infer<typeof channelMessageFormSchema>;

// User profile form schema
export const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  firstName: z.string().max(100, "First name is too long").optional(),
  lastName: z.string().max(100, "Last name is too long").optional(),
  bio: z.string().max(500, "Bio is too long").optional(),
  favoriteQuote: z.string().max(300, "Quote is too long").optional(),
  currentProject: z.string().max(200, "Project description is too long").optional(),
  favoriteSubstance: z.string().max(100, "Substance name is too long").optional(),
  intentions: z.string().max(500, "Intentions are too long").optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Timeline reflection form schema
export const reflectionFormSchema = z.object({
  periodType: z.enum(["week", "month"]),
  periodStart: z.string().datetime(),
  content: z.string().min(1, "Reflection cannot be empty").max(5000, "Reflection is too long"),
});

export type ReflectionFormValues = z.infer<typeof reflectionFormSchema>;

// Integration note form schema
export const integrationNoteFormSchema = z.object({
  reportId: z.number(),
  insightsCarriedForward: z.string().optional(),
  dailyLifeImpact: z.string().optional(),
  lessonsLearned: z.string().optional(),
});

export type IntegrationNoteFormValues = z.infer<typeof integrationNoteFormSchema>;

// Founder post form schema
export const founderPostFormSchema = z.object({
  mediaUrl: z.string().min(1, "Media URL is required"),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().max(2200, "Caption is too long").optional(),
});

export type FounderPostFormValues = z.infer<typeof founderPostFormSchema>;

// Helper function to validate substance
export function isValidSubstance(substance: string): boolean {
  return SUBSTANCES.includes(substance as any);
}

// Helper function to validate report status
export function isValidReportStatus(status: string): boolean {
  return REPORT_STATUSES.includes(status as any);
}

// Helper function to validate mood level
export function isValidMoodLevel(level: number): boolean {
  return level >= 1 && level <= 5;
}
