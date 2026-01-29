// Mood tracking routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertMoodEntrySchema } from "@shared/schema";

export const moodRouter = Router();

// Get user mood entries
moodRouter.get("/", isAuthenticated, async (req: any, res) => {
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

// Create mood entry
moodRouter.post("/", isAuthenticated, async (req: any, res) => {
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

// Delete mood entry
moodRouter.delete("/:id", isAuthenticated, async (req: any, res) => {
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

// Import mood data from external apps
moodRouter.post("/import", isAuthenticated, async (req: any, res) => {
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
