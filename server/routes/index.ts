// Main routes index - combines all route modules
import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";
import { storage } from "../storage";

// Import route modules
import { authRouter } from "./auth";
import { reportsRouter } from "./reports";
import { socialRouter } from "./social";
import { usersRouter } from "./users";
import { analyticsRouter } from "./analytics";
import { moodRouter } from "./mood";
import { integrationRouter } from "./integration";
import { badgesRouter } from "./badges";
import { channelsRouter } from "./channels";
import { founderRouter } from "./founder";
import { exportRouter } from "./export";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Setup object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Register route modules
  app.use("/api/auth", authRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/friends", socialRouter);
  app.use("/api/friendships", socialRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/user", usersRouter);
  app.use("/api/profile", usersRouter);
  app.use("/api", analyticsRouter);
  app.use("/api/mood", moodRouter);
  app.use("/api/integration", integrationRouter);
  app.use("/api/reflections", integrationRouter);
  app.use("/api/badges", badgesRouter);
  app.use("/api/channels", channelsRouter);
  app.use("/api/founder-posts", founderRouter);
  app.use("/api/export", exportRouter);

  // Legacy route compatibility - direct routes
  app.get("/api/feed", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const filters = {
      substance: req.query.substance as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
    };
    const feed = await storage.getFriendsFeed(userId, filters);
    res.json(feed);
  });

  app.get("/api/discover", isAuthenticated, async (req: any, res) => {
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
  });

  // Legacy delete comment route
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

  // Legacy import route
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

  // Seed default channels on startup
  storage.seedDefaultChannels().catch(err => {
    console.error("Error seeding default channels:", err);
  });

  return httpServer;
}
