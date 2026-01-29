import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username", { length: 30 }).unique(), // Public display name - what others see
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  favoriteQuote: text("favorite_quote"),
  currentProject: varchar("current_project", { length: 200 }),
  favoriteSubstance: varchar("favorite_substance", { length: 100 }),
  intentions: text("intentions"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingStep: integer("onboarding_step").default(0), // 0 = not started, 1-4 = current step, 5 = completed
  seenFeatureTooltips: text("seen_feature_tooltips").array(), // track which tooltips user has dismissed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Report status constants
export const REPORT_STATUS = ["draft", "private", "shared"] as const;
export type ReportStatus = typeof REPORT_STATUS[number];

// Trip reports table
export const tripReports = pgTable("trip_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  substance: varchar("substance", { length: 100 }).notNull(),
  amount: varchar("amount", { length: 100 }).notNull(),
  setMindset: text("set_mindset").notNull(),
  setting: text("setting").notNull(),
  experience: text("experience").notNull(),
  tags: text("tags").array(),
  isAnonymous: boolean("is_anonymous").default(false),
  companionIds: text("companion_ids").array(),
  isQuickLog: boolean("is_quick_log").default(false),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, private, shared
  shareExpiresAt: timestamp("share_expires_at"), // null = forever, or expiration date
  whatSurprised: text("what_surprised"),
  lessonsToRemember: text("lessons_to_remember"),
  dailyLifeApplication: text("daily_life_application"),
  weeklyIntention: text("weekly_intention"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Soft delete support
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("idx_trip_reports_user_id").on(table.userId),
  index("idx_trip_reports_created_at").on(table.createdAt),
  index("idx_trip_reports_status").on(table.status),
  index("idx_trip_reports_user_status").on(table.userId, table.status),
  index("idx_trip_reports_substance").on(table.substance),
]);

// Friend connections table
export const friendships = pgTable("friendships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_friendships_requester_id").on(table.requesterId),
  index("idx_friendships_addressee_id").on(table.addresseeId),
  index("idx_friendships_status").on(table.status),
]);

// Comments table
export const comments = pgTable("comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_comments_report_id").on(table.reportId),
  index("idx_comments_user_id").on(table.userId),
  index("idx_comments_parent_id").on(table.parentId),
]);

// Reactions table - supportive reactions for trip reports
export const reactions = pgTable("reactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // care, solidarity, strength, insight, gratitude
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reactions_report_id").on(table.reportId),
  index("idx_reactions_user_id").on(table.userId),
  index("idx_reactions_user_report").on(table.userId, table.reportId),
]);

// Mood entries table for tracking wellbeing over time
export const moodEntries = pgTable("mood_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_mood_entries_user_id").on(table.userId),
  index("idx_mood_entries_created_at").on(table.createdAt),
  index("idx_mood_entries_user_created").on(table.userId, table.createdAt),
]);

// Timeline reflections - periodic observations about patterns
export const timelineReflections = pgTable("timeline_reflections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodType: varchar("period_type", { length: 20 }).notNull(), // "week" or "month"
  periodStart: timestamp("period_start").notNull(), // Start of the week/month
  content: text("content").notNull(), // The reflection text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_timeline_reflections_user_id").on(table.userId),
  index("idx_timeline_reflections_period").on(table.userId, table.periodType, table.periodStart),
]);

// User badges for achievements and milestones
export const badges = pgTable("badges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeType: varchar("badge_type", { length: 50 }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  index("idx_badges_user_id").on(table.userId),
  index("idx_badges_user_type").on(table.userId, table.badgeType),
]);

// Community channels table
export const channels = pgTable("channels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // lucide icon name
  createdAt: timestamp("created_at").defaultNow(),
});

// Channel messages table
export const channelMessages = pgTable("channel_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_channel_messages_channel_id").on(table.channelId),
  index("idx_channel_messages_user_id").on(table.userId),
  index("idx_channel_messages_created_at").on(table.createdAt),
]);

// Founder username constant - this user gets auto-friended with everyone
export const FOUNDER_USERNAME = process.env.FOUNDER_USERNAME || "mushmore";

// Specific founder email addresses with full access (from environment variable)
// Format: comma-separated emails in FOUNDER_EMAILS env var
export const FOUNDER_EMAILS: string[] = (process.env.FOUNDER_EMAILS || "").split(",").filter(Boolean).map(e => e.trim().toLowerCase());

// Helper function to check if user is founder
export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.toLowerCase());
}

// Media type constants for posts
export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = typeof MEDIA_TYPES[number];

// Founder posts table - Instagram-style posts only the founder can create
export const founderPosts = pgTable("founder_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 20 }).notNull(), // image or video
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_founder_posts_user_id").on(table.userId),
  index("idx_founder_posts_created_at").on(table.createdAt),
]);

// Badge type constants
export const BADGE_TYPES = [
  "first_report",           // Created first report
  "five_reports",           // Created 5 reports
  "ten_reports",            // Created 10 reports
  "twenty_five_reports",    // Created 25 reports
  "integration_master",     // Completed all 4 reflection prompts on a report
  "consistent_tracker",     // 7-day mood streak
  "mood_champion",          // 30-day mood streak
  "social_explorer",        // Shared with 3+ friends
  "supportive_friend",      // Gave 10 reactions to others
  "storyteller",            // Reports totaling 1000+ words
] as const;
export type BadgeType = typeof BADGE_TYPES[number];

// Badge metadata for display
export const BADGE_INFO: Record<BadgeType, { name: string; description: string; icon: string }> = {
  first_report: { name: "First Steps", description: "Created your first trip report", icon: "sparkles" },
  five_reports: { name: "Getting Started", description: "Documented 5 experiences", icon: "book-open" },
  ten_reports: { name: "Dedicated Explorer", description: "Documented 10 experiences", icon: "compass" },
  twenty_five_reports: { name: "Journey Master", description: "Documented 25 experiences", icon: "trophy" },
  integration_master: { name: "Integration Master", description: "Completed all reflection prompts on a report", icon: "brain" },
  consistent_tracker: { name: "Consistent Tracker", description: "7-day mood check-in streak", icon: "flame" },
  mood_champion: { name: "Mood Champion", description: "30-day mood check-in streak", icon: "crown" },
  social_explorer: { name: "Social Explorer", description: "Shared experiences with 3+ friends", icon: "users" },
  supportive_friend: { name: "Supportive Friend", description: "Gave 10 supportive reactions to others", icon: "heart" },
  storyteller: { name: "Storyteller", description: "Written 1000+ words of experiences", icon: "pen-tool" },
};

// Integration questions - follow-up prompts after trips
export const integrationNotes = pgTable("integration_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightsCarriedForward: text("insights_carried_forward"),
  dailyLifeImpact: text("daily_life_impact"),
  lessonsLearned: text("lessons_learned"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_integration_notes_report_id").on(table.reportId),
  index("idx_integration_notes_user_id").on(table.userId),
  index("idx_integration_notes_user_report").on(table.userId, table.reportId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tripReports: many(tripReports),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  comments: many(comments),
  reactions: many(reactions),
  moodEntries: many(moodEntries),
  integrationNotes: many(integrationNotes),
  timelineReflections: many(timelineReflections),
  badges: many(badges),
  channelMessages: many(channelMessages),
  founderPosts: many(founderPosts),
}));

export const founderPostsRelations = relations(founderPosts, ({ one }) => ({
  user: one(users, {
    fields: [founderPosts.userId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ many }) => ({
  messages: many(channelMessages),
}));

export const channelMessagesRelations = relations(channelMessages, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMessages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [channelMessages.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, {
    fields: [badges.userId],
    references: [users.id],
  }),
}));

export const timelineReflectionsRelations = relations(timelineReflections, ({ one }) => ({
  user: one(users, {
    fields: [timelineReflections.userId],
    references: [users.id],
  }),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

export const integrationNotesRelations = relations(integrationNotes, ({ one }) => ({
  user: one(users, {
    fields: [integrationNotes.userId],
    references: [users.id],
  }),
  report: one(tripReports, {
    fields: [integrationNotes.reportId],
    references: [tripReports.id],
  }),
}));

export const tripReportsRelations = relations(tripReports, ({ one, many }) => ({
  user: one(users, {
    fields: [tripReports.userId],
    references: [users.id],
  }),
  comments: many(comments),
  reactions: many(reactions),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  report: one(tripReports, {
    fields: [comments.reportId],
    references: [tripReports.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parent",
  }),
  replies: many(comments, { relationName: "parent" }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  report: one(tripReports, {
    fields: [reactions.reportId],
    references: [tripReports.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertTripReportSchema = createInsertSchema(tripReports).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertIntegrationNoteSchema = createInsertSchema(integrationNotes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimelineReflectionSchema = createInsertSchema(timelineReflections).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  earnedAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
});

export const insertChannelMessageSchema = createInsertSchema(channelMessages).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertFounderPostSchema = createInsertSchema(founderPosts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Update profile schema (user-editable fields only)
export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  favoriteQuote: z.string().max(300).optional(),
  currentProject: z.string().max(200).optional(),
  favoriteSubstance: z.string().max(100).optional(),
  intentions: z.string().max(500).optional(),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TripReport = typeof tripReports.$inferSelect;
export type InsertTripReport = z.infer<typeof insertTripReportSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type IntegrationNote = typeof integrationNotes.$inferSelect;
export type InsertIntegrationNote = z.infer<typeof insertIntegrationNoteSchema>;
export type TimelineReflection = typeof timelineReflections.$inferSelect;
export type InsertTimelineReflection = z.infer<typeof insertTimelineReflectionSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type ChannelMessage = typeof channelMessages.$inferSelect;
export type InsertChannelMessage = z.infer<typeof insertChannelMessageSchema>;
export type ChannelMessageWithUser = ChannelMessage & { user: User };
export type FounderPost = typeof founderPosts.$inferSelect;
export type InsertFounderPost = z.infer<typeof insertFounderPostSchema>;
export type FounderPostWithUser = FounderPost & { user: User };

// Reaction type constants
export const REACTION_TYPES = ["care", "solidarity", "strength", "insight", "gratitude"] as const;
export type ReactionType = typeof REACTION_TYPES[number];

// Extended types for frontend
export type TripReportWithUser = TripReport & { user: User };
export type FriendshipWithUsers = Friendship & { requester: User; addressee: User };
export type CommentWithUser = Comment & { user: User };
export type ThreadedComment = CommentWithUser & { replies: CommentWithUser[] };
export type ReactionWithUser = Reaction & { user: User };
export type ReactionCount = { type: ReactionType; count: number; userReacted: boolean };
