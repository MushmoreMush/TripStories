// Trip reports routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertTripReportSchema } from "@shared/schema";

export const reportsRouter = Router();

// Get all user's trip reports
reportsRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const filters = {
      substance: req.query.substance as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
    };
    const reports = await storage.getUserTripReports(userId, filters);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// Get distinct substances used by user
reportsRouter.get("/substances", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const substances = await storage.getDistinctSubstances(userId);
    res.json(substances);
  } catch (error) {
    console.error("Error fetching substances:", error);
    res.status(500).json({ message: "Failed to fetch substances" });
  }
});

// Get single report by ID
reportsRouter.get("/:id", isAuthenticated, async (req: any, res) => {
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

// Update a report
reportsRouter.patch("/:id", isAuthenticated, async (req: any, res) => {
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

// Create new report
reportsRouter.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const parsed = insertTripReportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid report data", errors: parsed.error.errors });
    }

    const report = await storage.createTripReport(userId, parsed.data);
    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Failed to create report" });
  }
});

// Get report comments
reportsRouter.get("/:id/comments", isAuthenticated, async (req: any, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const comments = await storage.getReportComments(reportId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Create comment on report
reportsRouter.post("/:id/comments", isAuthenticated, async (req: any, res) => {
  try {
    const { insertCommentSchema } = await import("@shared/schema");
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

// Get report reactions
reportsRouter.get("/:id/reactions", isAuthenticated, async (req: any, res) => {
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

// Toggle reaction on report
reportsRouter.post("/:id/reactions", isAuthenticated, async (req: any, res) => {
  try {
    const { REACTION_TYPES, type ReactionType } = await import("@shared/schema");
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
