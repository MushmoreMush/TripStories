// Authentication routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { FOUNDER_USERNAME, FOUNDER_EMAILS } from "@shared/schema";

export const authRouter = Router();

// Get current authenticated user
authRouter.get("/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Check if current user is founder
authRouter.get("/is-founder", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    const isFounder = user && (
      FOUNDER_EMAILS.includes(user.email?.toLowerCase() || "") ||
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
