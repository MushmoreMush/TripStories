// Badge routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const badgesRouter = Router();

// Get user badges
badgesRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const userBadges = await storage.getUserBadges(userId);
    res.json(userBadges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Failed to fetch badges" });
  }
});

// Check and award new badges
badgesRouter.post("/check", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const newBadges = await storage.checkAndAwardBadges(userId);
    res.json({ newBadges });
  } catch (error) {
    console.error("Error checking badges:", error);
    res.status(500).json({ message: "Failed to check badges" });
  }
});
