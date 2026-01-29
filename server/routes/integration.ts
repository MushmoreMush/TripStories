// Integration notes and timeline reflections routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertIntegrationNoteSchema } from "@shared/schema";

export const integrationRouter = Router();

// Get integration note for a report
integrationRouter.get("/:reportId", isAuthenticated, async (req: any, res) => {
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

// Create/update integration note
integrationRouter.post("/", isAuthenticated, async (req: any, res) => {
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

// Get reports needing integration
integrationRouter.get("/pending/all", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const reports = await storage.getReportsNeedingIntegration(userId);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching pending integrations:", error);
    res.status(500).json({ message: "Failed to fetch pending integrations" });
  }
});

// Timeline reflections routes
integrationRouter.get("/reflections", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const reflections = await storage.getTimelineReflections(userId);
    res.json(reflections);
  } catch (error) {
    console.error("Error fetching reflections:", error);
    res.status(500).json({ message: "Failed to fetch reflections" });
  }
});

integrationRouter.post("/reflections", isAuthenticated, async (req: any, res) => {
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
