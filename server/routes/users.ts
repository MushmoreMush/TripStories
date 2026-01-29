// User routes (profile, search, onboarding)
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const usersRouter = Router();

// Update user profile
usersRouter.patch("/profile", isAuthenticated, async (req: any, res) => {
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
usersRouter.post("/onboarding", isAuthenticated, async (req: any, res) => {
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
usersRouter.post("/tooltips/dismiss", isAuthenticated, async (req: any, res) => {
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

// Search users
usersRouter.get("/search", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await storage.searchUsers(query, userId);
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});
