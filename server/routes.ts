import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTripReportSchema, insertCommentSchema, insertMoodEntrySchema, insertIntegrationNoteSchema, insertChannelMessageSchema, insertFounderPostSchema, REACTION_TYPES, FOUNDER_USERNAME, isFounderEmail, type ReactionType } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { searchLimiter, createLimiter, messageLimiter, authLimiter } from "./middleware/rateLimiter";
import { csrfTokenHandler, csrfProtection } from "./middleware/csrf";
import { logAuditFromRequest } from "./services/auditLog";
import { wsService } from "./services/websocket";
import { validateBody, validateQuery, reportFiltersSchema, paginationSchema, reportUpdateSchema, friendRequestSchema, friendResponseSchema, onboardingSchema, tooltipSchema, searchQuerySchema, reflectionSchema, channelMessageSchema, reactionSchema } from "./middleware/validation";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Setup object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // CSRF token endpoint
  app.get("/api/csrf-token", isAuthenticated, csrfTokenHandler);

  // Apply CSRF protection to state-changing routes (disabled in dev by default)
  app.use("/api", csrfProtection);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Trip reports routes - with pagination support
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = {
        substance: req.query.substance as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
      };
      const reports = await storage.getUserTripReports(userId, filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/substances", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const substances = await storage.getDistinctSubstances(userId);
      res.json(substances);
    } catch (error) {
      console.error("Error fetching substances:", error);
      res.status(500).json({ message: "Failed to fetch substances" });
    }
  });

  app.get("/api/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);
      const report = await storage.getTripReportById(reportId, userId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.patch("/api/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);
      
      const allowedFields = [
        "substance", "amount", "setMindset", "setting", "experience",
        "tags", "isAnonymous", "isQuickLog", "companionIds",
        "whatSurprised", "lessonsToRemember", "dailyLifeApplication", "weeklyIntention",
        "status", "shareExpiresAt"
      ];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Validate status if provided
      if (updateData.status !== undefined) {
        const validStatuses = ["draft", "private", "shared"];
        if (!validStatuses.includes(updateData.status)) {
          return res.status(400).json({ message: "Invalid status value. Must be 'draft', 'private', or 'shared'" });
        }
      }

      // Validate shareExpiresAt if provided
      if (updateData.shareExpiresAt !== undefined && updateData.shareExpiresAt !== null) {
        const date = new Date(updateData.shareExpiresAt);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid shareExpiresAt date" });
        }
        updateData.shareExpiresAt = date;
      }

      const report = await storage.updateTripReport(reportId, userId, updateData);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  app.post("/api/reports", isAuthenticated, createLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertTripReportSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid report data", errors: parsed.error.errors });
      }

      const report = await storage.createTripReport(userId, parsed.data);

      // Audit log
      logAuditFromRequest(req, "report_create", "trip_report", report.id, {
        substance: report.substance,
        status: report.status,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Feed route
  app.get("/api/feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = {
        substance: req.query.substance as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
      };
      const feed = await storage.getFriendsFeed(userId, filters);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // Friends routes
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pending = await storage.getPendingRequests(userId);
      res.set("Cache-Control", "no-store");
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  app.get("/api/friends/sent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sent = await storage.getSentRequests(userId);
      res.set("Cache-Control", "no-store");
      res.json(sent);
    } catch (error) {
      console.error("Error fetching sent requests:", error);
      res.status(500).json({ message: "Failed to fetch sent requests" });
    }
  });

  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const { addresseeId } = req.body;

      if (!addresseeId) {
        return res.status(400).json({ message: "Please select a user to send a request to" });
      }

      if (requesterId === addresseeId) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself" });
      }

      // Check if friendship already exists
      const existing = await storage.getFriendship(requesterId, addresseeId);
      if (existing) {
        if (existing.status === "pending") {
          return res.status(400).json({ message: "A friend request is already pending" });
        } else if (existing.status === "accepted") {
          return res.status(400).json({ message: "You are already friends" });
        } else if (existing.status === "rejected") {
          // Allow re-sending after rejection - delete old and create new
          await storage.deleteFriendship(existing.id, requesterId);
        }
      }

      const friendship = await storage.sendFriendRequest(requesterId, addresseeId);
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request. Please try again." });
    }
  });

  app.patch("/api/friends/request/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const friendship = await storage.respondToFriendRequest(requestId, status);
      res.json(friendship);
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.delete("/api/friendships/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendshipId = parseInt(req.params.id);

      await storage.deleteFriendship(friendshipId, userId);
      res.status(200).json({ message: "Friendship deleted" });
    } catch (error) {
      console.error("Error deleting friendship:", error);
      res.status(500).json({ message: "Failed to delete friendship" });
    }
  });

  // Update user profile
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { updateProfileSchema } = await import("@shared/schema");
      
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: parsed.error.errors });
      }

      // Check username uniqueness if provided
      if (parsed.data.username) {
        const existingUser = await storage.getUserByUsername(parsed.data.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      const user = await storage.updateUserProfile(userId, parsed.data);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update onboarding progress
  app.post("/api/user/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { step, completed } = req.body;

      if (typeof step !== "number" || step < 0 || step > 5) {
        return res.status(400).json({ message: "Invalid step value" });
      }

      const user = await storage.updateOnboardingProgress(userId, step, !!completed);
      res.json(user);
    } catch (error) {
      console.error("Error updating onboarding:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  // Dismiss feature tooltip
  app.post("/api/user/tooltips/dismiss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tooltipId } = req.body;

      if (!tooltipId || typeof tooltipId !== "string") {
        return res.status(400).json({ message: "Invalid tooltip ID" });
      }

      const user = await storage.dismissFeatureTooltip(userId, tooltipId);
      res.json(user);
    } catch (error) {
      console.error("Error dismissing tooltip:", error);
      res.status(500).json({ message: "Failed to dismiss tooltip" });
    }
  });

  // User search route (rate limited)
  app.get("/api/users/search", isAuthenticated, searchLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      // Limit query length to prevent abuse
      const sanitizedQuery = query.slice(0, 100);
      const users = await storage.searchUsers(sanitizedQuery, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Comments routes
  app.get("/api/reports/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const comments = await storage.getReportComments(reportId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/reports/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);
      const parsed = insertCommentSchema.safeParse({ ...req.body, reportId });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: parsed.error.errors });
      }

      const comment = await storage.createComment(userId, parsed.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = parseInt(req.params.id);
      await storage.deleteComment(commentId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Reactions routes
  app.get("/api/reports/:id/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);
      const reactions = await storage.getReportReactions(reportId, userId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  app.post("/api/reports/:id/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);
      const { type } = req.body as { type: string };

      if (!REACTION_TYPES.includes(type as ReactionType)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const result = await storage.toggleReaction(userId, reportId, type as ReactionType);
      res.json(result);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  // Insights route
  app.get("/api/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await storage.getUserInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // Export route - supports JSON and CSV
  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = (req.query.format as string || "json").toLowerCase();

      const reports = await storage.getUserTripReports(userId);
      const user = await storage.getUser(userId);

      // Audit log for data export (GDPR compliance)
      logAuditFromRequest(req, "data_export", "user_data", userId, { format, reportCount: reports.length });

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
        },
        totalReports: reports.length,
        reports: reports.map((report) => ({
          id: report.id,
          substance: report.substance,
          amount: report.amount,
          setMindset: report.setMindset,
          setting: report.setting,
          experience: report.experience,
          tags: report.tags,
          status: report.status,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        })),
      };

      if (format === "json") {
        const jsonString = JSON.stringify(exportData, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="trip-reports-${new Date().toISOString().split("T")[0]}.json"`);
        res.setHeader("Content-Length", Buffer.byteLength(jsonString));
        res.status(200).send(jsonString);
      } else if (format === "csv") {
        // Generate CSV
        const csvHeaders = ["ID", "Date", "Substance", "Amount", "Mindset", "Setting", "Experience", "Tags", "Status"];
        const csvRows = reports.map((report) => [
          report.id,
          report.createdAt ? new Date(report.createdAt).toISOString() : "",
          `"${(report.substance || "").replace(/"/g, '""')}"`,
          `"${(report.amount || "").replace(/"/g, '""')}"`,
          `"${(report.setMindset || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
          `"${(report.setting || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
          `"${(report.experience || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
          `"${(report.tags || []).join(", ")}"`,
          report.status,
        ].join(","));

        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="trip-reports-${new Date().toISOString().split("T")[0]}.csv"`);
        res.status(200).send(csvContent);
      } else {
        res.status(400).json({ message: "Unsupported format. Use: json or csv" });
      }
    } catch (error) {
      console.error("Error exporting reports:", error);
      res.status(500).json({ message: "Failed to export reports" });
    }
  });

  // Full data export for GDPR compliance
  app.get("/api/export/full", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Fetch all user data
      const [user, reports, moodEntries, reflections, badges] = await Promise.all([
        storage.getUser(userId),
        storage.getUserTripReports(userId),
        storage.getUserMoodEntries(userId),
        storage.getTimelineReflections(userId),
        storage.getUserBadges(userId),
      ]);

      logAuditFromRequest(req, "data_export", "full_user_data", userId);

      const fullExport = {
        exportedAt: new Date().toISOString(),
        dataSubject: {
          id: user?.id,
          email: user?.email,
          username: user?.username,
          firstName: user?.firstName,
          lastName: user?.lastName,
          bio: user?.bio,
          createdAt: user?.createdAt,
        },
        tripReports: reports,
        moodEntries: moodEntries,
        reflections: reflections,
        badges: badges,
      };

      const jsonString = JSON.stringify(fullExport, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="full-data-export-${new Date().toISOString().split("T")[0]}.json"`);
      res.status(200).send(jsonString);
    } catch (error) {
      console.error("Error generating full export:", error);
      res.status(500).json({ message: "Failed to generate full data export" });
    }
  });

  // Mood tracking routes
  app.get("/api/mood", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const daysBack = req.query.days ? parseInt(req.query.days as string) : undefined;
      const entries = await storage.getUserMoodEntries(userId, daysBack);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/mood", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertMoodEntrySchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid mood data", errors: parsed.error.errors });
      }

      const entry = await storage.createMoodEntry(userId, parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      res.status(500).json({ message: "Failed to create mood entry" });
    }
  });

  app.delete("/api/mood/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteMoodEntry(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mood entry:", error);
      res.status(500).json({ message: "Failed to delete mood entry" });
    }
  });

  // Integration notes routes
  app.get("/api/integration/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.reportId);
      const note = await storage.getIntegrationNote(reportId, userId);
      res.json(note || null);
    } catch (error) {
      console.error("Error fetching integration note:", error);
      res.status(500).json({ message: "Failed to fetch integration note" });
    }
  });

  app.post("/api/integration", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertIntegrationNoteSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid integration note data", errors: parsed.error.errors });
      }

      const note = await storage.upsertIntegrationNote(userId, parsed.data);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error saving integration note:", error);
      res.status(500).json({ message: "Failed to save integration note" });
    }
  });

  app.get("/api/integration/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getReportsNeedingIntegration(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching pending integrations:", error);
      res.status(500).json({ message: "Failed to fetch pending integrations" });
    }
  });

  // Pattern recognition route
  app.get("/api/patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patterns = await storage.getUserPatterns(userId);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching patterns:", error);
      res.status(500).json({ message: "Failed to fetch patterns" });
    }
  });

  // Timeline reflections
  app.get("/api/reflections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflections = await storage.getTimelineReflections(userId);
      res.json(reflections);
    } catch (error) {
      console.error("Error fetching reflections:", error);
      res.status(500).json({ message: "Failed to fetch reflections" });
    }
  });

  app.post("/api/reflections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { periodType, periodStart, content } = req.body;
      
      if (!periodType || !periodStart || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["week", "month"].includes(periodType)) {
        return res.status(400).json({ message: "periodType must be 'week' or 'month'" });
      }

      const parsedDate = new Date(periodStart);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid periodStart date" });
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content must be a non-empty string" });
      }

      const reflection = await storage.upsertTimelineReflection(userId, {
        periodType,
        periodStart: parsedDate.toISOString(),
        content: content.trim(),
      });
      res.json(reflection);
    } catch (error) {
      console.error("Error saving reflection:", error);
      res.status(500).json({ message: "Failed to save reflection" });
    }
  });

  // Import mood data from external apps
  app.post("/api/import/mood", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { entries } = req.body;

      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: "No entries provided" });
      }

      let imported = 0;
      let skipped = 0;

      for (const entry of entries) {
        try {
          const date = entry.date ? new Date(entry.date) : new Date();
          const level = Math.min(5, Math.max(1, parseInt(entry.level) || 3));
          const notes = entry.notes || entry.note || "";

          await storage.createMoodEntry(userId, {
            level,
            notes: notes.slice(0, 1000),
            createdAt: date,
          });
          imported++;
        } catch (err) {
          skipped++;
        }
      }

      res.json({ imported, skipped, total: entries.length });
    } catch (error) {
      console.error("Error importing mood data:", error);
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  // Correlation analysis route - substance/setting vs mood outcomes
  app.get("/api/correlations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getUserTripReports(userId);
      const moodEntries = await storage.getUserMoodEntries(userId, 90);

      // Build substance-mood correlation data
      const substanceMoodData: { substance: string; avgMoodBefore: number; avgMoodAfter: number; count: number }[] = [];
      const substanceGroups: Record<string, { before: number[]; after: number[] }> = {};

      for (const report of reports) {
        if (!report.createdAt) continue;
        const reportDate = new Date(report.createdAt);
        
        // Find mood entries within 3 days before and 3 days after the experience
        const moodsBefore = moodEntries.filter((m) => {
          const moodDate = new Date(m.createdAt!);
          const diff = (reportDate.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 3;
        });
        
        const moodsAfter = moodEntries.filter((m) => {
          const moodDate = new Date(m.createdAt!);
          const diff = (moodDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 1 && diff <= 7;
        });

        if (moodsBefore.length > 0 || moodsAfter.length > 0) {
          if (!substanceGroups[report.substance]) {
            substanceGroups[report.substance] = { before: [], after: [] };
          }
          if (moodsBefore.length > 0) {
            const avgBefore = moodsBefore.reduce((sum, m) => sum + m.level, 0) / moodsBefore.length;
            substanceGroups[report.substance].before.push(avgBefore);
          }
          if (moodsAfter.length > 0) {
            const avgAfter = moodsAfter.reduce((sum, m) => sum + m.level, 0) / moodsAfter.length;
            substanceGroups[report.substance].after.push(avgAfter);
          }
        }
      }

      for (const [substance, data] of Object.entries(substanceGroups)) {
        const avgBefore = data.before.length > 0 ? data.before.reduce((a, b) => a + b, 0) / data.before.length : 0;
        const avgAfter = data.after.length > 0 ? data.after.reduce((a, b) => a + b, 0) / data.after.length : 0;
        substanceMoodData.push({
          substance,
          avgMoodBefore: Math.round(avgBefore * 10) / 10,
          avgMoodAfter: Math.round(avgAfter * 10) / 10,
          count: Math.max(data.before.length, data.after.length),
        });
      }

      // Build setting-mood correlation data
      const settingMoodData: { setting: string; avgMood: number; count: number }[] = [];
      const settingGroups: Record<string, number[]> = {};

      for (const report of reports) {
        if (!report.setting || !report.createdAt) continue;
        const reportDate = new Date(report.createdAt);
        
        // Find mood entries within 7 days after the experience
        const moodsAfter = moodEntries.filter((m) => {
          const moodDate = new Date(m.createdAt!);
          const diff = (moodDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 1 && diff <= 7;
        });

        if (moodsAfter.length > 0) {
          const settingKey = report.setting.toLowerCase().slice(0, 30);
          if (!settingGroups[settingKey]) {
            settingGroups[settingKey] = [];
          }
          const avgMood = moodsAfter.reduce((sum, m) => sum + m.level, 0) / moodsAfter.length;
          settingGroups[settingKey].push(avgMood);
        }
      }

      for (const [setting, moods] of Object.entries(settingGroups)) {
        if (moods.length >= 1) {
          settingMoodData.push({
            setting: setting.charAt(0).toUpperCase() + setting.slice(1),
            avgMood: Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10,
            count: moods.length,
          });
        }
      }

      // Sort by count descending
      substanceMoodData.sort((a, b) => b.count - a.count);
      settingMoodData.sort((a, b) => b.count - a.count);

      res.json({
        substanceMood: substanceMoodData.slice(0, 10),
        settingMood: settingMoodData.slice(0, 8),
        totalReports: reports.length,
        totalMoodEntries: moodEntries.length,
      });
    } catch (error) {
      console.error("Error generating correlations:", error);
      res.status(500).json({ message: "Failed to generate correlations" });
    }
  });

  // Smart timing suggestions route
  app.get("/api/suggestions/timing", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moodEntries = await storage.getUserMoodEntries(userId, 30);
      const reports = await storage.getUserTripReports(userId);

      const suggestions: {
        type: "optimal" | "caution" | "insight";
        title: string;
        message: string;
      }[] = [];

      if (moodEntries.length === 0) {
        suggestions.push({
          type: "insight",
          title: "Start Tracking Your Mood",
          message: "Log your mood regularly to receive personalized timing suggestions based on your wellbeing patterns.",
        });
        return res.json({ suggestions });
      }

      // Calculate recent mood average (last 7 days) - moodEntries are sorted desc by createdAt
      const recentEntries = moodEntries.slice(0, 7);
      const recentAvg = recentEntries.reduce((sum, m) => sum + m.level, 0) / recentEntries.length;

      // Calculate overall average
      const overallAvg = moodEntries.reduce((sum, m) => sum + m.level, 0) / moodEntries.length;

      // Check for upward or downward mood trend
      // moodEntries are sorted descending (newest first), so:
      // - slice(0, half) = newer entries (secondHalf chronologically)
      // - slice(half) = older entries (firstHalf chronologically)
      const halfPoint = Math.floor(moodEntries.length / 2);
      const olderEntries = moodEntries.slice(halfPoint); // older entries
      const newerEntries = moodEntries.slice(0, halfPoint); // newer entries
      const olderAvg = olderEntries.length > 0 ? olderEntries.reduce((sum, m) => sum + m.level, 0) / olderEntries.length : 0;
      const newerAvg = newerEntries.length > 0 ? newerEntries.reduce((sum, m) => sum + m.level, 0) / newerEntries.length : 0;
      const trendUp = newerAvg > olderAvg;

      // Get last experience date - reports are sorted descending by createdAt
      const lastExperience = reports.length > 0 && reports[0].createdAt ? new Date(reports[0].createdAt) : null;
      const daysSinceLastExperience = lastExperience 
        ? Math.floor((Date.now() - lastExperience.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Generate suggestions based on data
      if (recentAvg >= 4) {
        suggestions.push({
          type: "optimal",
          title: "Mood is Positive",
          message: "Your recent mood has been consistently good (avg: " + recentAvg.toFixed(1) + "/5). If you're considering an experience, your current mental state appears stable.",
        });
      } else if (recentAvg <= 2.5) {
        suggestions.push({
          type: "caution",
          title: "Consider Waiting",
          message: "Your recent mood has been lower than usual (avg: " + recentAvg.toFixed(1) + "/5). Consider focusing on self-care and waiting for a more stable baseline before any experiences.",
        });
      }

      if (trendUp && moodEntries.length >= 10) {
        suggestions.push({
          type: "insight",
          title: "Positive Trend Detected",
          message: "Your mood has been trending upward recently. This is a good sign of emotional stability.",
        });
      } else if (!trendUp && moodEntries.length >= 10) {
        suggestions.push({
          type: "caution",
          title: "Mood Trend Declining",
          message: "Your mood has been trending downward. Consider what factors might be affecting your wellbeing before planning any experiences.",
        });
      }

      if (daysSinceLastExperience !== null && daysSinceLastExperience < 14) {
        suggestions.push({
          type: "insight",
          title: "Recent Experience",
          message: `Your last experience was ${daysSinceLastExperience} day${daysSinceLastExperience !== 1 ? 's' : ''} ago. Consider allowing adequate integration time between experiences.`,
        });
      }

      if (suggestions.length === 0) {
        suggestions.push({
          type: "insight",
          title: "Keep Tracking",
          message: "Continue logging your mood to receive more personalized suggestions. The more data we have, the better we can help you identify optimal timing.",
        });
      }

      res.json({ suggestions, stats: { recentAvg: recentAvg.toFixed(1), overallAvg: overallAvg.toFixed(1), daysSinceLastExperience } });
    } catch (error) {
      console.error("Error generating timing suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Therapist export route - professional summary format
  app.get("/api/export/therapist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getUserTripReports(userId);
      const user = await storage.getUser(userId);
      const moodEntries = await storage.getUserMoodEntries(userId, 90);
      const patterns = await storage.getUserPatterns(userId);

      // Calculate summary statistics
      const substanceCounts: Record<string, number> = {};
      reports.forEach((r) => {
        substanceCounts[r.substance] = (substanceCounts[r.substance] || 0) + 1;
      });

      const avgMood = moodEntries.length > 0 
        ? (moodEntries.reduce((sum, m) => sum + m.level, 0) / moodEntries.length).toFixed(1)
        : "N/A";

      const dateRange = reports.length > 0 
        ? {
            start: reports[reports.length - 1]?.createdAt,
            end: reports[0]?.createdAt,
          }
        : null;

      const therapistReport = {
        generatedAt: new Date().toISOString(),
        disclaimer: "This report is generated for informational purposes to support therapeutic discussion. It should be interpreted in the context of a professional healthcare relationship.",
        clientInfo: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Anonymous",
        },
        summary: {
          totalExperiences: reports.length,
          dateRange: dateRange ? {
            from: dateRange.start,
            to: dateRange.end,
          } : null,
          substancesUsed: Object.entries(substanceCounts).map(([substance, count]) => ({
            substance,
            frequency: count,
          })),
          averageMoodScore: avgMood,
          moodEntriesCount: moodEntries.length,
        },
        experienceDetails: reports.slice(0, 10).map((report) => ({
          date: report.createdAt,
          substance: report.substance,
          dosage: report.amount,
          setMindset: report.setMindset,
          setting: report.setting,
          experienceSummary: report.experience?.slice(0, 500) + (report.experience && report.experience.length > 500 ? "..." : ""),
        })),
        patternInsights: patterns.insights || [],
        moodTrends: {
          recentEntries: moodEntries.slice(0, 14).map((m) => ({
            date: m.createdAt,
            level: m.level,
            notes: m.notes,
          })),
        },
      };

      const jsonString = JSON.stringify(therapistReport, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="therapist-report-${new Date().toISOString().split("T")[0]}.json"`);
      res.status(200).send(jsonString);
    } catch (error) {
      console.error("Error generating therapist export:", error);
      res.status(500).json({ message: "Failed to generate therapist export" });
    }
  });

  // Streak tracking route
  app.get("/api/streak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserMoodEntries(userId, 90); // Last 90 days
      
      if (entries.length === 0) {
        return res.json({ currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckIn: null });
      }

      // Get unique dates with check-ins
      const checkInDates = new Set<string>();
      entries.forEach((entry) => {
        if (entry.createdAt) {
          const dateKey = new Date(entry.createdAt).toISOString().split("T")[0];
          checkInDates.add(dateKey);
        }
      });

      const sortedDates = Array.from(checkInDates).sort().reverse();
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = today;
      
      // Start from today or yesterday if no check-in today
      if (checkInDates.has(today)) {
        currentStreak = 1;
        checkDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      } else if (checkInDates.has(yesterday)) {
        currentStreak = 1;
        checkDate = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
      }

      // Count consecutive days
      while (checkInDates.has(checkDate)) {
        currentStreak++;
        const nextDate = new Date(new Date(checkDate).getTime() - 86400000);
        checkDate = nextDate.toISOString().split("T")[0];
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;

      sortedDates.reverse().forEach((dateStr) => {
        const date = new Date(dateStr);
        if (prevDate) {
          const diff = (date.getTime() - prevDate.getTime()) / 86400000;
          if (diff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = date;
      });
      longestStreak = Math.max(longestStreak, tempStreak);

      res.json({
        currentStreak,
        longestStreak,
        totalCheckIns: entries.length,
        lastCheckIn: entries[0]?.createdAt || null,
        checkedInToday: checkInDates.has(today),
      });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Badge routes
  app.get("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/badges/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const newBadges = await storage.checkAndAwardBadges(userId);
      res.json({ newBadges });
    } catch (error) {
      console.error("Error checking badges:", error);
      res.status(500).json({ message: "Failed to check badges" });
    }
  });

  // Discovery feed route
  app.get("/api/discover", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = {
        substance: req.query.substance as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
        friendId: req.query.friendId as string | undefined,
      };
      const reports = await storage.getDiscoveryFeed(userId, filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching discovery feed:", error);
      res.status(500).json({ message: "Failed to fetch discovery feed" });
    }
  });

  // Channel routes (Community Board)
  app.get("/api/channels", isAuthenticated, async (req: any, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/:id", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.get("/api/channels/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getChannelMessages(channelId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching channel messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/channels/:id/messages", isAuthenticated, messageLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channelId = parseInt(req.params.id);

      // Validate request body using schema
      const messageSchema = insertChannelMessageSchema.extend({
        content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
      });

      const parsed = messageSchema.safeParse({ ...req.body, channelId });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid message" });
      }

      const message = await storage.createChannelMessage(userId, {
        channelId: parsed.data.channelId,
        content: parsed.data.content.trim(),
      });

      // Fetch full message with user for WebSocket broadcast
      const user = await storage.getUser(userId);
      const messageWithUser = { ...message, user: user! };

      // Broadcast to WebSocket subscribers
      wsService.broadcastNewMessage(channelId, messageWithUser);

      // Audit log
      logAuditFromRequest(req, "message_create", "channel_message", message.id, {
        channelId,
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Seed default channels on startup
  storage.seedDefaultChannels().catch(err => {
    console.error("Error seeding default channels:", err);
  });

  // Founder posts routes
  app.get("/api/founder-posts", isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getFounderPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching founder posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/founder-posts", isAuthenticated, createLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Check if user is the founder (by email or username match)
      const isFounder = user && (
        isFounderEmail(user.email) ||
        user.firstName?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase()) ||
        user.email?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase())
      );

      if (!isFounder) {
        return res.status(403).json({ message: "Only the founder can create posts" });
      }
      
      // Validate request body - accept both URLs and object paths
      const postSchema = insertFounderPostSchema.extend({
        mediaUrl: z.string().min(1, "Media URL is required"),
        mediaType: z.enum(["image", "video"]),
        caption: z.string().max(2200, "Caption too long").optional(),
      });
      
      const parsed = postSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid post data" });
      }

      const post = await storage.createFounderPost(userId, parsed.data);
      res.json(post);
    } catch (error) {
      console.error("Error creating founder post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Check if current user is founder
  app.get("/api/auth/is-founder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const isFounder = user && (
        isFounderEmail(user.email) ||
        user.firstName?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase()) ||
        user.email?.toLowerCase().includes(FOUNDER_USERNAME.toLowerCase())
      );

      res.json({ isFounder: !!isFounder });
    } catch (error) {
      console.error("Error checking founder status:", error);
      res.status(500).json({ message: "Failed to check founder status" });
    }
  });

  return httpServer;
}
