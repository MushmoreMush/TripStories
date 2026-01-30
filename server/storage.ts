import {
  users,
  tripReports,
  friendships,
  comments,
  reactions,
  moodEntries,
  integrationNotes,
  timelineReflections,
  badges,
  channels,
  channelMessages,
  founderPosts,
  tripAnalysis,
  emergencyContacts,
  tripSitterSessions,
  preTripChecklists,
  checklistCompletions,
  directMessages,
  groupExperiences,
  groupParticipants,
  mentorshipProfiles,
  mentorships,
  weeklyChallenges,
  challengeProgress,
  customBadges,
  milestones,
  userSettings,
  FOUNDER_USERNAME,
  type User,
  type UpsertUser,
  type TripReport,
  type InsertTripReport,
  type Friendship,
  type TripReportWithUser,
  type FriendshipWithUsers,
  type Comment,
  type InsertComment,
  type CommentWithUser,
  type ThreadedComment,
  type Reaction,
  type InsertReaction,
  type ReactionCount,
  type ReactionType,
  type MoodEntry,
  type InsertMoodEntry,
  type IntegrationNote,
  type InsertIntegrationNote,
  type TimelineReflection,
  type InsertTimelineReflection,
  type Badge,
  type BadgeType,
  type Channel,
  type InsertChannel,
  type ChannelMessage,
  type InsertChannelMessage,
  type ChannelMessageWithUser,
  type FounderPost,
  type InsertFounderPost,
  type FounderPostWithUser,
  type TripAnalysis,
  type EmergencyContact,
  type TripSitterSession,
  type PreTripChecklist,
  type DirectMessage,
  type DirectMessageWithUsers,
  type GroupExperience,
  type GroupExperienceWithParticipants,
  type MentorshipProfile,
  type Mentorship,
  type MentorshipWithUsers,
  type WeeklyChallenge,
  type ChallengeProgress,
  type ChallengeProgressWithChallenge,
  type CustomBadge,
  type Milestone,
  type UserSettings,
  REACTION_TYPES,
  BADGE_TYPES,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ilike, ne, inArray, desc, gte, lte, sql } from "drizzle-orm";

export interface ReportFilters {
  substance?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, profile: Partial<User>): Promise<User>;
  updateOnboardingProgress(userId: string, step: number, completed: boolean): Promise<User>;
  dismissFeatureTooltip(userId: string, tooltipId: string): Promise<User>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;

  // Trip report operations
  createTripReport(userId: string, report: InsertTripReport): Promise<TripReport>;
  getTripReportById(reportId: number, userId: string): Promise<TripReport | undefined>;
  updateTripReport(reportId: number, userId: string, data: Partial<InsertTripReport>): Promise<TripReport | undefined>;
  getUserTripReports(userId: string, filters?: ReportFilters): Promise<TripReportWithUser[]>;
  getFriendsFeed(userId: string, filters?: ReportFilters): Promise<TripReportWithUser[]>;
  getDistinctSubstances(userId: string): Promise<string[]>;

  // Friendship operations
  getFriends(userId: string): Promise<User[]>;
  getPendingRequests(userId: string): Promise<FriendshipWithUsers[]>;
  getSentRequests(userId: string): Promise<FriendshipWithUsers[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  respondToFriendRequest(requestId: number, status: string): Promise<Friendship>;
  getFriendship(user1Id: string, user2Id: string): Promise<Friendship | undefined>;
  deleteFriendship(friendshipId: number, userId: string): Promise<void>;

  // Comment operations
  getReportComments(reportId: number): Promise<ThreadedComment[]>;
  createComment(userId: string, data: InsertComment): Promise<Comment>;
  deleteComment(commentId: number, userId: string): Promise<void>;

  // Reaction operations
  getReportReactions(reportId: number, userId: string): Promise<ReactionCount[]>;
  toggleReaction(userId: string, reportId: number, type: ReactionType): Promise<{ added: boolean }>;

  // Insights operations
  getUserInsights(userId: string): Promise<{
    substanceFrequency: { name: string; count: number }[];
    monthlyActivity: { month: string; count: number }[];
    tagFrequency: { name: string; count: number }[];
    totalReports: number;
    uniqueSubstances: number;
  }>;

  // Mood tracking operations
  createMoodEntry(userId: string, data: InsertMoodEntry): Promise<MoodEntry>;
  getUserMoodEntries(userId: string, daysBack?: number): Promise<MoodEntry[]>;
  deleteMoodEntry(id: number, userId: string): Promise<void>;

  // Integration notes operations
  getIntegrationNote(reportId: number, userId: string): Promise<IntegrationNote | undefined>;
  upsertIntegrationNote(userId: string, data: InsertIntegrationNote): Promise<IntegrationNote>;
  getReportsNeedingIntegration(userId: string): Promise<TripReport[]>;

  // Pattern recognition
  getUserPatterns(userId: string): Promise<{
    settingPatterns: { setting: string; avgMood: number; count: number }[];
    substancePatterns: { substance: string; avgMood: number; count: number }[];
    timePatterns: { timeOfDay: string; avgMood: number; count: number }[];
    insights: string[];
  }>;

  // Timeline reflections
  getTimelineReflections(userId: string): Promise<TimelineReflection[]>;
  upsertTimelineReflection(userId: string, data: InsertTimelineReflection): Promise<TimelineReflection>;

  // Badge operations
  getUserBadges(userId: string): Promise<Badge[]>;
  hasBadge(userId: string, badgeType: BadgeType): Promise<boolean>;
  awardBadge(userId: string, badgeType: BadgeType): Promise<Badge | null>;
  checkAndAwardBadges(userId: string): Promise<Badge[]>;
  
  // Discovery feed
  getDiscoveryFeed(userId: string, filters?: ReportFilters & { friendId?: string }): Promise<TripReportWithUser[]>;
  
  // Channel operations
  getChannels(): Promise<Channel[]>;
  getChannelById(channelId: number): Promise<Channel | undefined>;
  createChannel(data: InsertChannel): Promise<Channel>;
  getChannelMessages(channelId: number, limit?: number): Promise<ChannelMessageWithUser[]>;
  createChannelMessage(userId: string, data: InsertChannelMessage): Promise<ChannelMessage>;
  seedDefaultChannels(): Promise<void>;
  
  // Founder posts operations
  getFounderPosts(): Promise<FounderPostWithUser[]>;
  createFounderPost(userId: string, data: InsertFounderPost): Promise<FounderPost>;
  
  // Auto-friend founder operations
  getFounderUser(): Promise<User | undefined>;
  autoFriendFounder(newUserId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profile: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateOnboardingProgress(userId: string, step: number, completed: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        onboardingStep: step,
        hasCompletedOnboarding: completed,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async dismissFeatureTooltip(userId: string, tooltipId: string): Promise<User> {
    const existingUser = await this.getUser(userId);
    const currentTooltips = existingUser?.seenFeatureTooltips || [];
    
    if (!currentTooltips.includes(tooltipId)) {
      const [user] = await db
        .update(users)
        .set({
          seenFeatureTooltips: [...currentTooltips, tooltipId],
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    }
    return existingUser!;
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    const results = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, currentUserId),
          or(
            ilike(users.firstName, searchPattern),
            ilike(users.lastName, searchPattern),
            ilike(users.email, searchPattern)
          )
        )
      )
      .limit(20);
    return results;
  }

  // Trip report operations
  async createTripReport(userId: string, report: InsertTripReport): Promise<TripReport> {
    const [newReport] = await db
      .insert(tripReports)
      .values({
        ...report,
        userId,
      })
      .returning();
    return newReport;
  }

  async getTripReportById(reportId: number, userId: string): Promise<TripReport | undefined> {
    const [report] = await db
      .select()
      .from(tripReports)
      .where(and(eq(tripReports.id, reportId), eq(tripReports.userId, userId)));
    return report;
  }

  async updateTripReport(reportId: number, userId: string, data: Partial<InsertTripReport>): Promise<TripReport | undefined> {
    const [report] = await db
      .update(tripReports)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(tripReports.id, reportId), eq(tripReports.userId, userId)))
      .returning();
    return report;
  }

  async getUserTripReports(userId: string, filters?: ReportFilters): Promise<TripReportWithUser[]> {
    const conditions = [eq(tripReports.userId, userId)];
    
    if (filters?.substance) {
      conditions.push(eq(tripReports.substance, filters.substance));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(tripReports.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(tripReports.createdAt, new Date(filters.dateTo)));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(tripReports.substance, searchPattern),
          ilike(tripReports.experience, searchPattern),
          ilike(tripReports.setMindset, searchPattern),
          ilike(tripReports.setting, searchPattern)
        )!
      );
    }

    const reports = await db.query.tripReports.findMany({
      where: and(...conditions),
      with: {
        user: true,
      },
      orderBy: [desc(tripReports.createdAt)],
    });
    return reports;
  }

  async getDistinctSubstances(userId: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ substance: tripReports.substance })
      .from(tripReports)
      .where(eq(tripReports.userId, userId));
    return results.map((r) => r.substance);
  }

  async getFriendsFeed(userId: string, filters?: ReportFilters): Promise<TripReportWithUser[]> {
    // Get all friend IDs
    const userFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

    const friendIds = userFriendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Include user's own reports in the feed
    friendIds.push(userId);

    if (friendIds.length === 0) {
      return [];
    }

    const conditions = [inArray(tripReports.userId, friendIds)];
    
    if (filters?.substance) {
      conditions.push(eq(tripReports.substance, filters.substance));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(tripReports.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(tripReports.createdAt, new Date(filters.dateTo)));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(tripReports.substance, searchPattern),
          ilike(tripReports.experience, searchPattern),
          ilike(tripReports.setMindset, searchPattern),
          ilike(tripReports.setting, searchPattern)
        )!
      );
    }

    const reports = await db.query.tripReports.findMany({
      where: and(...conditions),
      with: {
        user: true,
      },
      orderBy: [desc(tripReports.createdAt)],
      limit: 50,
    });

    return reports;
  }

  // Friendship operations
  async getFriends(userId: string): Promise<User[]> {
    const acceptedFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

    const friendIds = acceptedFriendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    if (friendIds.length === 0) {
      return [];
    }

    const friends = await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));

    return friends;
  }

  async getPendingRequests(userId: string): Promise<FriendshipWithUsers[]> {
    const pending = await db.query.friendships.findMany({
      where: and(
        eq(friendships.addresseeId, userId),
        eq(friendships.status, "pending")
      ),
      with: {
        requester: true,
        addressee: true,
      },
    });
    return pending;
  }

  async getSentRequests(userId: string): Promise<FriendshipWithUsers[]> {
    const sent = await db.query.friendships.findMany({
      where: and(
        eq(friendships.requesterId, userId),
        eq(friendships.status, "pending")
      ),
      with: {
        requester: true,
        addressee: true,
      },
    });
    return sent;
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: "pending",
      })
      .returning();
    return friendship;
  }

  async respondToFriendRequest(requestId: number, status: string): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendships.id, requestId))
      .returning();
    return friendship;
  }

  async getFriendship(user1Id: string, user2Id: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, user1Id),
            eq(friendships.addresseeId, user2Id)
          ),
          and(
            eq(friendships.requesterId, user2Id),
            eq(friendships.addresseeId, user1Id)
          )
        )
      );
    return friendship;
  }

  async deleteFriendship(friendshipId: number, userId: string): Promise<void> {
    await db.delete(friendships).where(
      and(
        eq(friendships.id, friendshipId),
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId)
        )
      )
    );
  }

  // Comment operations
  async getReportComments(reportId: number): Promise<ThreadedComment[]> {
    const allComments = await db.query.comments.findMany({
      where: eq(comments.reportId, reportId),
      with: {
        user: true,
      },
      orderBy: [comments.createdAt],
    });

    // Build threaded structure
    const topLevelComments: ThreadedComment[] = [];
    const repliesMap = new Map<number, CommentWithUser[]>();

    // First pass: separate top-level comments and group replies
    allComments.forEach((comment) => {
      if (comment.parentId) {
        const existing = repliesMap.get(comment.parentId) || [];
        existing.push(comment);
        repliesMap.set(comment.parentId, existing);
      }
    });

    // Second pass: build threaded structure for top-level comments
    allComments.forEach((comment) => {
      if (!comment.parentId) {
        const threadedComment: ThreadedComment = {
          ...comment,
          replies: repliesMap.get(comment.id) || [],
        };
        topLevelComments.push(threadedComment);
      }
    });

    // Sort top-level by newest first
    topLevelComments.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    return topLevelComments;
  }

  async createComment(userId: string, data: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...data,
        userId,
      })
      .returning();
    return comment;
  }

  async deleteComment(commentId: number, userId: string): Promise<void> {
    await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
  }

  // Reaction operations
  async getReportReactions(reportId: number, userId: string): Promise<ReactionCount[]> {
    const allReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.reportId, reportId));

    const counts: ReactionCount[] = REACTION_TYPES.map((type) => {
      const typeReactions = allReactions.filter((r) => r.type === type);
      return {
        type,
        count: typeReactions.length,
        userReacted: typeReactions.some((r) => r.userId === userId),
      };
    });

    return counts;
  }

  async toggleReaction(userId: string, reportId: number, type: ReactionType): Promise<{ added: boolean }> {
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, userId),
          eq(reactions.reportId, reportId),
          eq(reactions.type, type)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(reactions)
        .where(eq(reactions.id, existing[0].id));
      return { added: false };
    } else {
      await db
        .insert(reactions)
        .values({ userId, reportId, type });
      return { added: true };
    }
  }

  // Insights operations
  async getUserInsights(userId: string): Promise<{
    substanceFrequency: { name: string; count: number }[];
    monthlyActivity: { month: string; count: number }[];
    tagFrequency: { name: string; count: number }[];
    totalReports: number;
    uniqueSubstances: number;
  }> {
    // Get all user reports
    const userReports = await db
      .select()
      .from(tripReports)
      .where(eq(tripReports.userId, userId));

    const totalReports = userReports.length;

    // Substance frequency
    const substanceMap = new Map<string, number>();
    for (const report of userReports) {
      const count = substanceMap.get(report.substance) || 0;
      substanceMap.set(report.substance, count + 1);
    }
    const substanceFrequency = Array.from(substanceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const uniqueSubstances = substanceMap.size;

    // Monthly activity (last 12 months)
    const monthlyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, 0);
    }
    for (const report of userReports) {
      if (report.createdAt) {
        const date = new Date(report.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
        }
      }
    }
    const monthlyActivity = Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    // Tag frequency
    const tagMap = new Map<string, number>();
    for (const report of userReports) {
      if (report.tags) {
        for (const tag of report.tags) {
          const count = tagMap.get(tag) || 0;
          tagMap.set(tag, count + 1);
        }
      }
    }
    const tagFrequency = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      substanceFrequency,
      monthlyActivity,
      tagFrequency,
      totalReports,
      uniqueSubstances,
    };
  }

  // Mood tracking operations
  async createMoodEntry(userId: string, data: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db
      .insert(moodEntries)
      .values({ ...data, userId })
      .returning();
    return entry;
  }

  async getUserMoodEntries(userId: string, daysBack?: number): Promise<MoodEntry[]> {
    const conditions = [eq(moodEntries.userId, userId)];
    
    if (daysBack) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      conditions.push(gte(moodEntries.createdAt, cutoffDate));
    }

    return await db
      .select()
      .from(moodEntries)
      .where(and(...conditions))
      .orderBy(desc(moodEntries.createdAt));
  }

  async deleteMoodEntry(id: number, userId: string): Promise<void> {
    await db
      .delete(moodEntries)
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)));
  }

  // Integration notes operations
  async getIntegrationNote(reportId: number, userId: string): Promise<IntegrationNote | undefined> {
    const [note] = await db
      .select()
      .from(integrationNotes)
      .where(and(eq(integrationNotes.reportId, reportId), eq(integrationNotes.userId, userId)));
    return note;
  }

  async upsertIntegrationNote(userId: string, data: InsertIntegrationNote): Promise<IntegrationNote> {
    const existing = await this.getIntegrationNote(data.reportId, userId);
    
    if (existing) {
      const [updated] = await db
        .update(integrationNotes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(integrationNotes.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(integrationNotes)
        .values({ ...data, userId })
        .returning();
      return created;
    }
  }

  async getReportsNeedingIntegration(userId: string): Promise<TripReport[]> {
    // Get reports from 3-14 days ago that don't have integration notes
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const userReports = await db
      .select()
      .from(tripReports)
      .where(
        and(
          eq(tripReports.userId, userId),
          lte(tripReports.createdAt, threeDaysAgo),
          gte(tripReports.createdAt, fourteenDaysAgo)
        )
      );

    // Filter out reports that already have integration notes
    const existingNotes = await db
      .select({ reportId: integrationNotes.reportId })
      .from(integrationNotes)
      .where(eq(integrationNotes.userId, userId));

    const noteReportIds = new Set(existingNotes.map(n => n.reportId));
    return userReports.filter(r => !noteReportIds.has(r.id));
  }

  // Pattern recognition
  async getUserPatterns(userId: string): Promise<{
    settingPatterns: { setting: string; avgMood: number; count: number }[];
    substancePatterns: { substance: string; avgMood: number; count: number }[];
    timePatterns: { timeOfDay: string; avgMood: number; count: number }[];
    insights: string[];
  }> {
    // Get all user reports and mood entries
    const userReports = await db
      .select()
      .from(tripReports)
      .where(eq(tripReports.userId, userId))
      .orderBy(desc(tripReports.createdAt));

    const userMoods = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt));

    // Calculate average mood within 7 days after each trip
    const getAvgMoodAfterTrip = (tripDate: Date): number | null => {
      const weekLater = new Date(tripDate);
      weekLater.setDate(weekLater.getDate() + 7);
      
      const relevantMoods = userMoods.filter(m => {
        if (!m.createdAt) return false;
        const moodDate = new Date(m.createdAt);
        return moodDate >= tripDate && moodDate <= weekLater;
      });

      if (relevantMoods.length === 0) return null;
      return relevantMoods.reduce((sum, m) => sum + m.level, 0) / relevantMoods.length;
    };

    // Setting patterns - extract keywords
    const settingStats = new Map<string, { totalMood: number; count: number }>();
    const settingKeywords = ['outdoor', 'indoor', 'nature', 'home', 'beach', 'forest', 'mountain', 'city', 'alone', 'group', 'friends', 'solo'];
    
    for (const report of userReports) {
      if (!report.createdAt) continue;
      const avgMood = getAvgMoodAfterTrip(new Date(report.createdAt));
      if (avgMood === null) continue;

      const settingLower = report.setting.toLowerCase();
      for (const keyword of settingKeywords) {
        if (settingLower.includes(keyword)) {
          const stats = settingStats.get(keyword) || { totalMood: 0, count: 0 };
          stats.totalMood += avgMood;
          stats.count += 1;
          settingStats.set(keyword, stats);
        }
      }
    }

    const settingPatterns = Array.from(settingStats.entries())
      .filter(([_, stats]) => stats.count >= 2)
      .map(([setting, stats]) => ({
        setting,
        avgMood: Math.round((stats.totalMood / stats.count) * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b.avgMood - a.avgMood);

    // Substance patterns
    const substanceStats = new Map<string, { totalMood: number; count: number }>();
    for (const report of userReports) {
      if (!report.createdAt) continue;
      const avgMood = getAvgMoodAfterTrip(new Date(report.createdAt));
      if (avgMood === null) continue;

      const stats = substanceStats.get(report.substance) || { totalMood: 0, count: 0 };
      stats.totalMood += avgMood;
      stats.count += 1;
      substanceStats.set(report.substance, stats);
    }

    const substancePatterns = Array.from(substanceStats.entries())
      .map(([substance, stats]) => ({
        substance,
        avgMood: Math.round((stats.totalMood / stats.count) * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b.avgMood - a.avgMood);

    // Time of day patterns
    const timeStats = new Map<string, { totalMood: number; count: number }>();
    for (const report of userReports) {
      if (!report.createdAt) continue;
      const avgMood = getAvgMoodAfterTrip(new Date(report.createdAt));
      if (avgMood === null) continue;

      const hour = new Date(report.createdAt).getHours();
      let timeOfDay: string;
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      const stats = timeStats.get(timeOfDay) || { totalMood: 0, count: 0 };
      stats.totalMood += avgMood;
      stats.count += 1;
      timeStats.set(timeOfDay, stats);
    }

    const timePatterns = Array.from(timeStats.entries())
      .map(([timeOfDay, stats]) => ({
        timeOfDay,
        avgMood: Math.round((stats.totalMood / stats.count) * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b.avgMood - a.avgMood);

    // Generate insights
    const insights: string[] = [];
    
    if (settingPatterns.length > 0) {
      const best = settingPatterns[0];
      insights.push(`Your ${best.setting} experiences tend to result in better moods (avg ${best.avgMood}/5)`);
    }

    if (substancePatterns.length > 1) {
      const best = substancePatterns[0];
      insights.push(`${best.substance} experiences have your highest post-trip mood average (${best.avgMood}/5)`);
    }

    if (timePatterns.length > 1) {
      const best = timePatterns[0];
      insights.push(`${best.timeOfDay.charAt(0).toUpperCase() + best.timeOfDay.slice(1)} sessions tend to work best for you`);
    }

    // Mood trend insight
    if (userMoods.length >= 7) {
      const recentMoods = userMoods.slice(0, 7);
      const olderMoods = userMoods.slice(7, 14);
      if (olderMoods.length >= 3) {
        const recentAvg = recentMoods.reduce((s, m) => s + m.level, 0) / recentMoods.length;
        const olderAvg = olderMoods.reduce((s, m) => s + m.level, 0) / olderMoods.length;
        if (recentAvg > olderAvg + 0.5) {
          insights.push("Your mood has been trending upward recently");
        } else if (recentAvg < olderAvg - 0.5) {
          insights.push("Your mood has been lower recently - consider what might be affecting you");
        }
      }
    }

    return {
      settingPatterns,
      substancePatterns,
      timePatterns,
      insights,
    };
  }

  // Timeline reflections
  async getTimelineReflections(userId: string): Promise<TimelineReflection[]> {
    const reflections = await db
      .select()
      .from(timelineReflections)
      .where(eq(timelineReflections.userId, userId))
      .orderBy(desc(timelineReflections.periodStart));
    return reflections;
  }

  async upsertTimelineReflection(userId: string, data: InsertTimelineReflection): Promise<TimelineReflection> {
    const existing = await db
      .select()
      .from(timelineReflections)
      .where(
        and(
          eq(timelineReflections.userId, userId),
          eq(timelineReflections.periodType, data.periodType),
          eq(timelineReflections.periodStart, new Date(data.periodStart))
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(timelineReflections)
        .set({
          content: data.content,
          updatedAt: new Date(),
        })
        .where(eq(timelineReflections.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(timelineReflections)
      .values({
        ...data,
        userId,
        periodStart: new Date(data.periodStart),
      })
      .returning();
    return created;
  }

  // Badge operations
  async getUserBadges(userId: string): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.userId, userId))
      .orderBy(desc(badges.earnedAt));
  }

  async hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, userId), eq(badges.badgeType, badgeType)));
    return !!existing;
  }

  async awardBadge(userId: string, badgeType: BadgeType): Promise<Badge | null> {
    const alreadyHas = await this.hasBadge(userId, badgeType);
    if (alreadyHas) return null;

    const [badge] = await db
      .insert(badges)
      .values({ userId, badgeType })
      .returning();
    return badge;
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const newBadges: Badge[] = [];

    // Get user data for checking milestones
    const userReports = await db
      .select()
      .from(tripReports)
      .where(eq(tripReports.userId, userId));

    const userMoods = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt));

    const userReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.userId, userId));

    // Check report milestones
    const reportCount = userReports.length;
    if (reportCount >= 1) {
      const badge = await this.awardBadge(userId, "first_report");
      if (badge) newBadges.push(badge);
    }
    if (reportCount >= 5) {
      const badge = await this.awardBadge(userId, "five_reports");
      if (badge) newBadges.push(badge);
    }
    if (reportCount >= 10) {
      const badge = await this.awardBadge(userId, "ten_reports");
      if (badge) newBadges.push(badge);
    }
    if (reportCount >= 25) {
      const badge = await this.awardBadge(userId, "twenty_five_reports");
      if (badge) newBadges.push(badge);
    }

    // Check integration master - all 4 reflection prompts completed on any report
    const hasIntegrationMaster = userReports.some(
      (r) => r.whatSurprised && r.lessonsToRemember && r.dailyLifeApplication && r.weeklyIntention
    );
    if (hasIntegrationMaster) {
      const badge = await this.awardBadge(userId, "integration_master");
      if (badge) newBadges.push(badge);
    }

    // Check mood streak milestones
    if (userMoods.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let currentStreak = 0;
      let checkDate = new Date(today);

      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(checkDate);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const hasEntryOnDay = userMoods.some((m) => {
          if (!m.createdAt) return false;
          const entryDate = new Date(m.createdAt);
          return entryDate >= dayStart && entryDate <= dayEnd;
        });

        if (hasEntryOnDay) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      if (currentStreak >= 7) {
        const badge = await this.awardBadge(userId, "consistent_tracker");
        if (badge) newBadges.push(badge);
      }
      if (currentStreak >= 30) {
        const badge = await this.awardBadge(userId, "mood_champion");
        if (badge) newBadges.push(badge);
      }
    }

    // Check social explorer - shared with 3+ friends
    const sharedReports = userReports.filter((r) => r.status === "shared");
    if (sharedReports.length >= 3) {
      const badge = await this.awardBadge(userId, "social_explorer");
      if (badge) newBadges.push(badge);
    }

    // Check supportive friend - 10+ reactions given
    if (userReactions.length >= 10) {
      const badge = await this.awardBadge(userId, "supportive_friend");
      if (badge) newBadges.push(badge);
    }

    // Check storyteller - 1000+ words total
    const totalWords = userReports.reduce((sum, r) => {
      const words = (r.experience || "").split(/\s+/).filter(Boolean).length +
        (r.setMindset || "").split(/\s+/).filter(Boolean).length +
        (r.setting || "").split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
    if (totalWords >= 1000) {
      const badge = await this.awardBadge(userId, "storyteller");
      if (badge) newBadges.push(badge);
    }

    return newBadges;
  }

  // Discovery feed - friends' shared reports
  async getDiscoveryFeed(userId: string, filters?: ReportFilters & { friendId?: string }): Promise<TripReportWithUser[]> {
    // Get all friend IDs
    const userFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

    let friendIds = userFriendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Filter by specific friend if requested
    if (filters?.friendId) {
      friendIds = friendIds.filter((id) => id === filters.friendId);
    }

    if (friendIds.length === 0) {
      return [];
    }

    const now = new Date();
    const conditions = [
      inArray(tripReports.userId, friendIds),
      eq(tripReports.status, "shared"),
    ];
    
    // Add expiration check - reports with null expiration OR expiration in the future
    conditions.push(
      sql`(${tripReports.shareExpiresAt} IS NULL OR ${tripReports.shareExpiresAt} >= ${now})`
    );

    if (filters?.substance) {
      conditions.push(eq(tripReports.substance, filters.substance));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(tripReports.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(tripReports.createdAt, new Date(filters.dateTo)));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(tripReports.substance, searchPattern),
          ilike(tripReports.experience, searchPattern),
          ilike(tripReports.setMindset, searchPattern),
          ilike(tripReports.setting, searchPattern)
        )!
      );
    }

    const reports = await db.query.tripReports.findMany({
      where: and(...conditions),
      with: {
        user: true,
      },
      orderBy: [desc(tripReports.createdAt)],
      limit: 50,
    });

    return reports;
  }

  // Channel operations
  async getChannels(): Promise<Channel[]> {
    return await db.select().from(channels).orderBy(channels.id);
  }

  async getChannelById(channelId: number): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, channelId));
    return channel;
  }

  async createChannel(data: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(data).returning();
    return channel;
  }

  async getChannelMessages(channelId: number, limit: number = 100): Promise<ChannelMessageWithUser[]> {
    const messages = await db.query.channelMessages.findMany({
      where: eq(channelMessages.channelId, channelId),
      with: {
        user: true,
      },
      orderBy: [desc(channelMessages.createdAt)],
      limit,
    });
    
    // Reverse to show oldest first (like chat apps)
    return messages.reverse();
  }

  async createChannelMessage(userId: string, data: InsertChannelMessage): Promise<ChannelMessage> {
    const [message] = await db
      .insert(channelMessages)
      .values({ ...data, userId })
      .returning();
    return message;
  }

  async seedDefaultChannels(): Promise<void> {
    const existingChannels = await this.getChannels();
    if (existingChannels.length > 0) return;

    const defaultChannels: InsertChannel[] = [
      {
        name: "General",
        description: "Open discussion for the community",
        icon: "hash",
      },
      {
        name: "Integration Tips",
        description: "Share insights and techniques for integration",
        icon: "lightbulb",
      },
      {
        name: "Support Circle",
        description: "A safe space for community support",
        icon: "heart",
      },
    ];

    for (const channel of defaultChannels) {
      await this.createChannel(channel);
    }
  }

  // Founder posts operations
  async getFounderPosts(): Promise<FounderPostWithUser[]> {
    const posts = await db.query.founderPosts.findMany({
      with: {
        user: true,
      },
      orderBy: [desc(founderPosts.createdAt)],
    });
    return posts;
  }

  async createFounderPost(userId: string, data: InsertFounderPost): Promise<FounderPost> {
    const [post] = await db
      .insert(founderPosts)
      .values({ ...data, userId })
      .returning();
    return post;
  }

  // Auto-friend founder operations
  async getFounderUser(): Promise<User | undefined> {
    // Look for user with "mushmore" in their name or email
    const [founder] = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${FOUNDER_USERNAME}%`),
          ilike(users.lastName, `%${FOUNDER_USERNAME}%`),
          ilike(users.email, `%${FOUNDER_USERNAME}%`)
        )
      );
    return founder;
  }

  async autoFriendFounder(newUserId: string): Promise<void> {
    const founder = await this.getFounderUser();
    if (!founder || founder.id === newUserId) return;

    // Check if friendship already exists
    const existing = await this.getFriendship(newUserId, founder.id);
    if (existing) return;

    // Create auto-accepted friendship
    await db.insert(friendships).values({
      requesterId: founder.id,
      addresseeId: newUserId,
      status: "accepted",
    });
  }

  // =====================
  // NEW FEATURE METHODS
  // =====================

  // Trip Analysis operations
  async saveTripAnalysis(reportId: number, analysis: any): Promise<TripAnalysis> {
    // Check if analysis already exists
    const existing = await this.getTripAnalysis(reportId);
    if (existing) {
      const [updated] = await db
        .update(tripAnalysis)
        .set({
          themes: analysis.themes,
          emotionalArc: analysis.emotionalArc,
          keyInsights: analysis.keyInsights,
          suggestedIntegration: analysis.suggestedIntegration,
          sentimentScore: analysis.sentimentScore,
          wordCount: analysis.wordCount,
          readingLevel: analysis.readingLevel,
        })
        .where(eq(tripAnalysis.reportId, reportId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(tripAnalysis)
      .values({
        reportId,
        themes: analysis.themes,
        emotionalArc: analysis.emotionalArc,
        keyInsights: analysis.keyInsights,
        suggestedIntegration: analysis.suggestedIntegration,
        sentimentScore: analysis.sentimentScore,
        wordCount: analysis.wordCount,
        readingLevel: analysis.readingLevel,
      })
      .returning();
    return created;
  }

  async getTripAnalysis(reportId: number): Promise<TripAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(tripAnalysis)
      .where(eq(tripAnalysis.reportId, reportId));
    return analysis;
  }

  // Emergency Contacts operations
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId))
      .orderBy(desc(emergencyContacts.isPrimary));
  }

  async createEmergencyContact(userId: string, data: any): Promise<EmergencyContact> {
    const [contact] = await db
      .insert(emergencyContacts)
      .values({ ...data, userId })
      .returning();
    return contact;
  }

  async deleteEmergencyContact(id: number, userId: string): Promise<void> {
    await db
      .delete(emergencyContacts)
      .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.userId, userId)));
  }

  // Trip Sitter operations
  async getActiveTripSitterSession(userId: string): Promise<TripSitterSession | null> {
    const [session] = await db
      .select()
      .from(tripSitterSessions)
      .where(and(eq(tripSitterSessions.userId, userId), eq(tripSitterSessions.status, "active")));
    return session || null;
  }

  async createTripSitterSession(userId: string, data: any): Promise<TripSitterSession> {
    const [session] = await db
      .insert(tripSitterSessions)
      .values({
        userId,
        startTime: new Date(data.startTime),
        expectedDuration: data.expectedDuration,
        checkInInterval: data.checkInInterval,
        substance: data.substance,
        emergencyContactId: data.emergencyContactId,
        status: "active",
      })
      .returning();
    return session;
  }

  async tripSitterCheckIn(userId: string): Promise<TripSitterSession | null> {
    const [session] = await db
      .update(tripSitterSessions)
      .set({ lastCheckIn: new Date() })
      .where(and(eq(tripSitterSessions.userId, userId), eq(tripSitterSessions.status, "active")))
      .returning();
    return session || null;
  }

  async endTripSitterSession(userId: string): Promise<TripSitterSession | null> {
    const [session] = await db
      .update(tripSitterSessions)
      .set({ status: "completed" })
      .where(and(eq(tripSitterSessions.userId, userId), eq(tripSitterSessions.status, "active")))
      .returning();
    return session || null;
  }

  // Checklist operations
  async getChecklists(userId: string): Promise<PreTripChecklist[]> {
    return await db
      .select()
      .from(preTripChecklists)
      .where(eq(preTripChecklists.userId, userId));
  }

  async createChecklist(userId: string, data: any): Promise<PreTripChecklist> {
    const [checklist] = await db
      .insert(preTripChecklists)
      .values({ ...data, userId })
      .returning();
    return checklist;
  }

  async completeChecklist(userId: string, checklistId: number, completedItems: any, reportId?: number): Promise<any> {
    const [completion] = await db
      .insert(checklistCompletions)
      .values({ userId, checklistId, completedItems, reportId })
      .returning();
    return completion;
  }

  // Direct Messages operations
  async getConversations(userId: string): Promise<any[]> {
    const sent = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.senderId, userId));
    const received = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.receiverId, userId));

    const partnerIds = new Set<string>();
    [...sent, ...received].forEach(m => {
      partnerIds.add(m.senderId === userId ? m.receiverId : m.senderId);
    });

    const conversations = [];
    for (const partnerId of partnerIds) {
      const partner = await this.getUser(partnerId);
      const lastMessage = [...sent, ...received]
        .filter(m => m.senderId === partnerId || m.receiverId === partnerId)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];
      const unread = received.filter(m => m.senderId === partnerId && !m.isRead).length;

      conversations.push({
        partner,
        lastMessage,
        unreadCount: unread
      });
    }

    return conversations.sort((a, b) =>
      new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime()
    );
  }

  async getDirectMessages(userId: string, friendId: string): Promise<DirectMessageWithUsers[]> {
    const messages = await db.query.directMessages.findMany({
      where: or(
        and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, friendId)),
        and(eq(directMessages.senderId, friendId), eq(directMessages.receiverId, userId))
      ),
      with: {
        sender: true,
        receiver: true,
      },
      orderBy: [directMessages.createdAt],
    });
    return messages;
  }

  async sendDirectMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
    const [message] = await db
      .insert(directMessages)
      .values({ senderId, receiverId, content })
      .returning();
    return message;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(directMessages)
      .set({ isRead: true })
      .where(and(eq(directMessages.receiverId, userId), eq(directMessages.senderId, senderId)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const unread = await db
      .select()
      .from(directMessages)
      .where(and(eq(directMessages.receiverId, userId), eq(directMessages.isRead, false)));
    return unread.length;
  }

  // Group Experience operations
  async getGroupExperiences(userId: string): Promise<GroupExperienceWithParticipants[]> {
    const groups = await db.query.groupExperiences.findMany({
      with: {
        creator: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(groupExperiences.createdAt)],
    });
    return groups.filter(g =>
      g.creatorId === userId || g.participants.some(p => p.userId === userId)
    );
  }

  async getGroupExperience(id: number, userId: string): Promise<GroupExperienceWithParticipants | null> {
    const group = await db.query.groupExperiences.findFirst({
      where: eq(groupExperiences.id, id),
      with: {
        creator: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
    });
    return group || null;
  }

  async createGroupExperience(userId: string, data: any): Promise<GroupExperience> {
    const [group] = await db
      .insert(groupExperiences)
      .values({
        ...data,
        creatorId: userId,
        date: new Date(data.date),
      })
      .returning();

    // Add creator as participant
    await db.insert(groupParticipants).values({
      groupExperienceId: group.id,
      userId,
      role: "creator",
    });

    return group;
  }

  async inviteToGroup(groupId: number, inviterId: string, inviteeId: string): Promise<any> {
    const [participant] = await db
      .insert(groupParticipants)
      .values({
        groupExperienceId: groupId,
        userId: inviteeId,
        role: "participant",
      })
      .returning();
    return participant;
  }

  async linkReportToGroup(groupId: number, userId: string, reportId: number): Promise<void> {
    await db
      .update(groupParticipants)
      .set({ reportId })
      .where(and(eq(groupParticipants.groupExperienceId, groupId), eq(groupParticipants.userId, userId)));
  }

  // Mentorship operations
  async getMentorshipProfile(userId: string): Promise<MentorshipProfile | null> {
    const [profile] = await db
      .select()
      .from(mentorshipProfiles)
      .where(eq(mentorshipProfiles.userId, userId));
    return profile || null;
  }

  async upsertMentorshipProfile(userId: string, data: any): Promise<MentorshipProfile> {
    const existing = await this.getMentorshipProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(mentorshipProfiles)
        .set(data)
        .where(eq(mentorshipProfiles.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(mentorshipProfiles)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async getAvailableMentors(): Promise<(MentorshipProfile & { user: User })[]> {
    const profiles = await db.query.mentorshipProfiles.findMany({
      where: and(eq(mentorshipProfiles.isMentor, true), eq(mentorshipProfiles.isAvailable, true)),
      with: {
        user: true,
      },
    });
    return profiles;
  }

  async getMentorshipConnections(userId: string): Promise<MentorshipWithUsers[]> {
    const connections = await db.query.mentorships.findMany({
      where: or(eq(mentorships.mentorId, userId), eq(mentorships.menteeId, userId)),
      with: {
        mentor: true,
        mentee: true,
      },
    });
    return connections;
  }

  async requestMentorship(menteeId: string, mentorId: string): Promise<Mentorship> {
    const [connection] = await db
      .insert(mentorships)
      .values({ menteeId, mentorId, status: "pending" })
      .returning();
    return connection;
  }

  async respondToMentorship(id: number, userId: string, accept: boolean): Promise<Mentorship> {
    const [connection] = await db
      .update(mentorships)
      .set({
        status: accept ? "active" : "declined",
        startedAt: accept ? new Date() : null,
      })
      .where(and(eq(mentorships.id, id), eq(mentorships.mentorId, userId)))
      .returning();
    return connection;
  }

  // Weekly Challenges operations
  async getCurrentChallenges(): Promise<WeeklyChallenge[]> {
    const now = new Date();
    return await db
      .select()
      .from(weeklyChallenges)
      .where(and(lte(weeklyChallenges.weekStart, now), gte(weeklyChallenges.weekEnd, now)));
  }

  async getUserChallengeProgress(userId: string): Promise<ChallengeProgressWithChallenge[]> {
    const progress = await db.query.challengeProgress.findMany({
      where: eq(challengeProgress.userId, userId),
      with: {
        challenge: true,
      },
      orderBy: [desc(challengeProgress.createdAt)],
    });
    return progress;
  }

  async updateChallengeProgress(userId: string, challengeId: number, progressValue: number): Promise<ChallengeProgress> {
    const existing = await db
      .select()
      .from(challengeProgress)
      .where(and(eq(challengeProgress.userId, userId), eq(challengeProgress.challengeId, challengeId)));

    if (existing.length > 0) {
      const challenge = await db.select().from(weeklyChallenges).where(eq(weeklyChallenges.id, challengeId));
      const isCompleted = progressValue >= (challenge[0]?.points || 100);

      const [updated] = await db
        .update(challengeProgress)
        .set({
          progress: progressValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        })
        .where(eq(challengeProgress.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(challengeProgress)
      .values({ userId, challengeId, progress: progressValue })
      .returning();
    return created;
  }

  // Custom Badges operations
  async getCustomBadges(userId: string): Promise<CustomBadge[]> {
    return await db
      .select()
      .from(customBadges)
      .where(eq(customBadges.userId, userId))
      .orderBy(desc(customBadges.earnedAt));
  }

  async createCustomBadge(userId: string, data: any): Promise<CustomBadge> {
    const [badge] = await db
      .insert(customBadges)
      .values({ ...data, userId })
      .returning();
    return badge;
  }

  // Milestones operations
  async getMilestones(userId: string): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(eq(milestones.userId, userId))
      .orderBy(desc(milestones.date));
  }

  async getUpcomingMilestones(userId: string): Promise<Milestone[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.userId, userId),
          gte(milestones.date, now),
          lte(milestones.date, thirtyDaysFromNow),
          eq(milestones.celebrated, false)
        )
      )
      .orderBy(milestones.date);
  }

  async celebrateMilestone(id: number, userId: string): Promise<void> {
    await db
      .update(milestones)
      .set({ celebrated: true })
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
  }

  async createMilestone(userId: string, data: any): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values({ ...data, userId, date: new Date(data.date) })
      .returning();
    return milestone;
  }

  // User Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || null;
  }

  async updateUserSettings(userId: string, data: any): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(userSettings)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  // Community Benchmarks
  async getCommunityBenchmarks(userId: string): Promise<any> {
    const allReports = await db.select().from(tripReports);
    const allMoods = await db.select().from(moodEntries);
    const userReports = allReports.filter(r => r.userId === userId);
    const userMoods = allMoods.filter(m => m.userId === userId);

    const communityAvgReports = allReports.length / (await db.select().from(users)).length;
    const userReportCount = userReports.length;

    const communityAvgMood = allMoods.length > 0
      ? allMoods.reduce((sum, m) => sum + m.level, 0) / allMoods.length
      : 0;
    const userAvgMood = userMoods.length > 0
      ? userMoods.reduce((sum, m) => sum + m.level, 0) / userMoods.length
      : 0;

    // Substance popularity
    const substanceCounts: Record<string, number> = {};
    allReports.forEach(r => {
      substanceCounts[r.substance] = (substanceCounts[r.substance] || 0) + 1;
    });
    const topSubstances = Object.entries(substanceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([substance, count]) => ({ substance, count }));

    return {
      yourStats: {
        reportCount: userReportCount,
        avgMood: Math.round(userAvgMood * 10) / 10,
      },
      communityStats: {
        avgReportsPerUser: Math.round(communityAvgReports * 10) / 10,
        avgMood: Math.round(communityAvgMood * 10) / 10,
        topSubstances,
        totalUsers: (await db.select().from(users)).length,
        totalReports: allReports.length,
      }
    };
  }

  // Long-term Outcomes
  async getLongTermOutcomes(userId: string): Promise<any> {
    const reports = await this.getUserTripReports(userId);
    const moods = await this.getUserMoodEntries(userId, 365);

    if (reports.length === 0) {
      return { message: "Not enough data for long-term analysis" };
    }

    // Calculate mood trends over time
    const monthlyMoods: Record<string, number[]> = {};
    moods.forEach(m => {
      if (m.createdAt) {
        const month = new Date(m.createdAt).toISOString().slice(0, 7);
        if (!monthlyMoods[month]) monthlyMoods[month] = [];
        monthlyMoods[month].push(m.level);
      }
    });

    const moodTrend = Object.entries(monthlyMoods)
      .map(([month, levels]) => ({
        month,
        avgMood: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate experience impact
    const firstReport = reports[reports.length - 1];
    const firstReportDate = firstReport?.createdAt ? new Date(firstReport.createdAt) : null;

    const moodsBeforeFirstTrip = moods.filter(m =>
      m.createdAt && firstReportDate && new Date(m.createdAt) < firstReportDate
    );
    const moodsAfterFirstTrip = moods.filter(m =>
      m.createdAt && firstReportDate && new Date(m.createdAt) >= firstReportDate
    );

    const avgMoodBefore = moodsBeforeFirstTrip.length > 0
      ? moodsBeforeFirstTrip.reduce((sum, m) => sum + m.level, 0) / moodsBeforeFirstTrip.length
      : null;
    const avgMoodAfter = moodsAfterFirstTrip.length > 0
      ? moodsAfterFirstTrip.reduce((sum, m) => sum + m.level, 0) / moodsAfterFirstTrip.length
      : null;

    return {
      moodTrend,
      experienceImpact: {
        avgMoodBefore: avgMoodBefore ? Math.round(avgMoodBefore * 10) / 10 : null,
        avgMoodAfter: avgMoodAfter ? Math.round(avgMoodAfter * 10) / 10 : null,
        change: avgMoodBefore && avgMoodAfter
          ? Math.round((avgMoodAfter - avgMoodBefore) * 10) / 10
          : null,
      },
      totalExperiences: reports.length,
      timespan: firstReportDate
        ? Math.floor((Date.now() - firstReportDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  }

  // Integration Success Score
  async getIntegrationScore(userId: string): Promise<any> {
    const reports = await this.getUserTripReports(userId);
    const notes = await db
      .select()
      .from(integrationNotes)
      .where(eq(integrationNotes.userId, userId));

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const report of reports) {
      maxPossibleScore += 100;
      let reportScore = 0;

      // Points for completing integration prompts on the report
      if (report.whatSurprised) reportScore += 15;
      if (report.lessonsToRemember) reportScore += 15;
      if (report.dailyLifeApplication) reportScore += 20;
      if (report.weeklyIntention) reportScore += 20;

      // Points for having integration notes
      const reportNote = notes.find(n => n.reportId === report.id);
      if (reportNote) {
        if (reportNote.insightsCarriedForward) reportScore += 10;
        if (reportNote.dailyLifeImpact) reportScore += 10;
        if (reportNote.lessonsLearned) reportScore += 10;
      }

      totalScore += reportScore;
    }

    const overallScore = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

    // Detailed breakdown
    const reportsWithFullIntegration = reports.filter(r =>
      r.whatSurprised && r.lessonsToRemember && r.dailyLifeApplication && r.weeklyIntention
    ).length;

    return {
      overallScore,
      totalReports: reports.length,
      fullyIntegratedReports: reportsWithFullIntegration,
      integrationNotes: notes.length,
      breakdown: {
        promptsCompleted: reports.filter(r => r.whatSurprised || r.lessonsToRemember || r.dailyLifeApplication || r.weeklyIntention).length,
        notesCompleted: notes.length,
      },
      recommendations: overallScore < 50
        ? ["Try completing all 4 reflection prompts on your next report", "Add integration notes to recent experiences"]
        : overallScore < 80
        ? ["Great progress! Consider adding weekly intentions to more reports"]
        : ["Excellent integration practice! Keep it up!"],
    };
  }
}

export const storage = new DatabaseStorage();
