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
});

// Friend connections table
export const friendships = pgTable("friendships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reactions table - supportive reactions for trip reports
export const reactions = pgTable("reactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // care, solidarity, strength, insight, gratitude
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood entries table for tracking wellbeing over time
export const moodEntries = pgTable("mood_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline reflections - periodic observations about patterns
export const timelineReflections = pgTable("timeline_reflections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodType: varchar("period_type", { length: 20 }).notNull(), // "week" or "month"
  periodStart: timestamp("period_start").notNull(), // Start of the week/month
  content: text("content").notNull(), // The reflection text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User badges for achievements and milestones
export const badges = pgTable("badges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeType: varchar("badge_type", { length: 50 }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

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
});

// Founder username constant - this user gets auto-friended with everyone
export const FOUNDER_USERNAME = "mushmore";

// Specific founder email addresses with full access
export const FOUNDER_EMAILS = [
  "jeremy.margent@gmail.com",
  "mushmoremushmore@gmail.com"
];

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
});

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

// AI Trip Analysis results
export const tripAnalysis = pgTable("trip_analysis", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => tripReports.id, { onDelete: "cascade" }),
  themes: text("themes").array(), // Extracted themes
  emotionalArc: jsonb("emotional_arc"), // { start, peak, end, transitions }
  keyInsights: text("key_insights").array(),
  suggestedIntegration: text("suggested_integration").array(),
  sentimentScore: integer("sentiment_score"), // -100 to 100
  wordCount: integer("word_count"),
  readingLevel: varchar("reading_level", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Substance Interactions database
export const substanceInteractions = pgTable("substance_interactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  substance1: varchar("substance_1", { length: 100 }).notNull(),
  substance2: varchar("substance_2", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // safe, caution, dangerous, deadly
  description: text("description").notNull(),
  effects: text("effects"),
  recommendations: text("recommendations"),
});

// Trip Sitter Sessions
export const tripSitterSessions = pgTable("trip_sitter_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  expectedDuration: integer("expected_duration").notNull(), // in minutes
  checkInInterval: integer("check_in_interval").notNull(), // in minutes
  substance: varchar("substance", { length: 100 }),
  emergencyContactId: integer("emergency_contact_id"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, emergency
  lastCheckIn: timestamp("last_check_in"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emergency Contacts
export const emergencyContacts = pgTable("emergency_contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  relationship: varchar("relationship", { length: 50 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pre-Trip Checklists
export const preTripChecklists = pgTable("pre_trip_checklists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  items: jsonb("items").notNull(), // Array of { id, text, category, required }
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist Completions
export const checklistCompletions = pgTable("checklist_completions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checklistId: integer("checklist_id").notNull().references(() => preTripChecklists.id, { onDelete: "cascade" }),
  completedItems: jsonb("completed_items"), // Array of item IDs
  completedAt: timestamp("completed_at").defaultNow(),
  reportId: integer("report_id").references(() => tripReports.id, { onDelete: "set null" }),
});

// Direct Messages
export const directMessages = pgTable("direct_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Experiences
export const groupExperiences = pgTable("group_experiences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  setting: text("setting"),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Experience Participants
export const groupParticipants = pgTable("group_participants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupExperienceId: integer("group_experience_id").notNull().references(() => groupExperiences.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportId: integer("report_id").references(() => tripReports.id, { onDelete: "set null" }),
  role: varchar("role", { length: 20 }).notNull().default("participant"), // creator, participant, sitter
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Mentorship Profiles
export const mentorshipProfiles = pgTable("mentorship_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isMentor: boolean("is_mentor").default(false),
  experienceLevel: varchar("experience_level", { length: 20 }), // beginner, intermediate, experienced
  substances: text("substances").array(), // Areas of experience
  bio: text("bio"),
  maxMentees: integer("max_mentees").default(3),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mentorship Connections
export const mentorships = pgTable("mentorships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mentorId: varchar("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  menteeId: varchar("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, completed, declined
  startedAt: timestamp("started_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Challenges
export const weeklyChallenges = pgTable("weekly_challenges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // integration, mindfulness, journaling, social
  points: integer("points").notNull().default(10),
  requirements: jsonb("requirements"), // { type, target, ... }
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge Progress
export const challengeProgress = pgTable("challenge_progress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => weeklyChallenges.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Badges (user-created)
export const customBadges = pgTable("custom_badges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 200 }),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  milestone: text("milestone"), // What achievement this represents
});

// Milestones (for celebrations)
export const milestones = pgTable("milestones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // first_report_anniversary, streak_milestone, etc.
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  celebrated: boolean("celebrated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings (for dark mode, etc.)
export const userSettings = pgTable("user_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  darkMode: boolean("dark_mode").default(false),
  notifications: jsonb("notifications").default({}), // { email, push, sms }
  privacy: jsonb("privacy").default({}), // { showProfile, showReports, etc. }
  calendarSync: jsonb("calendar_sync").default({}), // { enabled, provider, token }
  voiceEnabled: boolean("voice_enabled").default(false),
  offlineEnabled: boolean("offline_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

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

// New feature relations
export const tripAnalysisRelations = relations(tripAnalysis, ({ one }) => ({
  report: one(tripReports, {
    fields: [tripAnalysis.reportId],
    references: [tripReports.id],
  }),
}));

export const tripSitterSessionsRelations = relations(tripSitterSessions, ({ one }) => ({
  user: one(users, {
    fields: [tripSitterSessions.userId],
    references: [users.id],
  }),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyContacts.userId],
    references: [users.id],
  }),
}));

export const preTripChecklistsRelations = relations(preTripChecklists, ({ one }) => ({
  user: one(users, {
    fields: [preTripChecklists.userId],
    references: [users.id],
  }),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const groupExperiencesRelations = relations(groupExperiences, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupExperiences.creatorId],
    references: [users.id],
  }),
  participants: many(groupParticipants),
}));

export const groupParticipantsRelations = relations(groupParticipants, ({ one }) => ({
  groupExperience: one(groupExperiences, {
    fields: [groupParticipants.groupExperienceId],
    references: [groupExperiences.id],
  }),
  user: one(users, {
    fields: [groupParticipants.userId],
    references: [users.id],
  }),
  report: one(tripReports, {
    fields: [groupParticipants.reportId],
    references: [tripReports.id],
  }),
}));

export const mentorshipProfilesRelations = relations(mentorshipProfiles, ({ one }) => ({
  user: one(users, {
    fields: [mentorshipProfiles.userId],
    references: [users.id],
  }),
}));

export const mentorshipsRelations = relations(mentorships, ({ one }) => ({
  mentor: one(users, {
    fields: [mentorships.mentorId],
    references: [users.id],
    relationName: "mentor",
  }),
  mentee: one(users, {
    fields: [mentorships.menteeId],
    references: [users.id],
    relationName: "mentee",
  }),
}));

export const weeklyChallengesRelations = relations(weeklyChallenges, ({ many }) => ({
  progress: many(challengeProgress),
}));

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  user: one(users, {
    fields: [challengeProgress.userId],
    references: [users.id],
  }),
  challenge: one(weeklyChallenges, {
    fields: [challengeProgress.challengeId],
    references: [weeklyChallenges.id],
  }),
}));

export const customBadgesRelations = relations(customBadges, ({ one }) => ({
  user: one(users, {
    fields: [customBadges.userId],
    references: [users.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  user: one(users, {
    fields: [milestones.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
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

// New feature insert schemas
export const insertTripAnalysisSchema = createInsertSchema(tripAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertTripSitterSessionSchema = createInsertSchema(tripSitterSessions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertPreTripChecklistSchema = createInsertSchema(preTripChecklists).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export const insertGroupExperienceSchema = createInsertSchema(groupExperiences).omit({
  id: true,
  creatorId: true,
  createdAt: true,
});

export const insertGroupParticipantSchema = createInsertSchema(groupParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertMentorshipProfileSchema = createInsertSchema(mentorshipProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMentorshipSchema = createInsertSchema(mentorships).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyChallengeSchema = createInsertSchema(weeklyChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeProgressSchema = createInsertSchema(challengeProgress).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertCustomBadgeSchema = createInsertSchema(customBadges).omit({
  id: true,
  userId: true,
  earnedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  updatedAt: true,
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

// New feature types
export type TripAnalysis = typeof tripAnalysis.$inferSelect;
export type InsertTripAnalysis = z.infer<typeof insertTripAnalysisSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type TripSitterSession = typeof tripSitterSessions.$inferSelect;
export type InsertTripSitterSession = z.infer<typeof insertTripSitterSessionSchema>;
export type PreTripChecklist = typeof preTripChecklists.$inferSelect;
export type InsertPreTripChecklist = z.infer<typeof insertPreTripChecklistSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type GroupExperience = typeof groupExperiences.$inferSelect;
export type InsertGroupExperience = z.infer<typeof insertGroupExperienceSchema>;
export type GroupParticipant = typeof groupParticipants.$inferSelect;
export type InsertGroupParticipant = z.infer<typeof insertGroupParticipantSchema>;
export type MentorshipProfile = typeof mentorshipProfiles.$inferSelect;
export type InsertMentorshipProfile = z.infer<typeof insertMentorshipProfileSchema>;
export type Mentorship = typeof mentorships.$inferSelect;
export type InsertMentorship = z.infer<typeof insertMentorshipSchema>;
export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type InsertWeeklyChallenge = z.infer<typeof insertWeeklyChallengeSchema>;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;
export type CustomBadge = typeof customBadges.$inferSelect;
export type InsertCustomBadge = z.infer<typeof insertCustomBadgeSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type SubstanceInteraction = typeof substanceInteractions.$inferSelect;

// Extended types for new features
export type DirectMessageWithUsers = DirectMessage & { sender: User; receiver: User };
export type GroupExperienceWithParticipants = GroupExperience & { creator: User; participants: (GroupParticipant & { user: User })[] };
export type MentorshipWithUsers = Mentorship & { mentor: User; mentee: User };
export type ChallengeProgressWithChallenge = ChallengeProgress & { challenge: WeeklyChallenge };

// Substance interaction severity levels
export const INTERACTION_SEVERITY = ["safe", "caution", "dangerous", "deadly"] as const;
export type InteractionSeverity = typeof INTERACTION_SEVERITY[number];

// Challenge categories
export const CHALLENGE_CATEGORIES = ["integration", "mindfulness", "journaling", "social", "wellness"] as const;
export type ChallengeCategory = typeof CHALLENGE_CATEGORIES[number];

// Milestone types
export const MILESTONE_TYPES = [
  "first_report_anniversary",
  "membership_anniversary",
  "streak_milestone",
  "report_milestone",
  "mood_milestone"
] as const;
export type MilestoneType = typeof MILESTONE_TYPES[number];

// Extended types for frontend
export type TripReportWithUser = TripReport & { user: User };
export type TripReportWithAnalysis = TripReport & { user: User; analysis?: TripAnalysis };
export type FriendshipWithUsers = Friendship & { requester: User; addressee: User };
export type CommentWithUser = Comment & { user: User };
export type ThreadedComment = CommentWithUser & { replies: CommentWithUser[] };
export type ReactionWithUser = Reaction & { user: User };
export type ReactionCount = { type: ReactionType; count: number; userReacted: boolean };

// Substance list for interactions
export const SUBSTANCES = [
  "Psilocybin",
  "LSD",
  "DMT",
  "Ayahuasca",
  "MDMA",
  "Ketamine",
  "Mescaline",
  "2C-B",
  "Salvia",
  "Cannabis",
  "Alcohol",
  "Caffeine",
  "Tobacco",
  "SSRIs",
  "MAOIs",
  "Benzodiazepines",
  "Opioids",
  "Stimulants",
  "Other"
] as const;
export type Substance = typeof SUBSTANCES[number];
