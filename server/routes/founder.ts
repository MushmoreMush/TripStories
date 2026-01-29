// Founder posts routes
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertFounderPostSchema, FOUNDER_USERNAME, FOUNDER_EMAILS } from "@shared/schema";

export const founderRouter = Router();

// Get founder posts
founderRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const posts = await storage.getFounderPosts();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching founder posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Create founder post (founder only)
founderRouter.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    // Check if user is the founder (by email list or username match)
    const isFounder = user && (
      FOUNDER_EMAILS.includes(user.email?.toLowerCase() || "") ||
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
