// Community channels routes
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertChannelMessageSchema } from "@shared/schema";

export const channelsRouter = Router();

// Get all channels
channelsRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const channels = await storage.getChannels();
    res.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ message: "Failed to fetch channels" });
  }
});

// Get single channel
channelsRouter.get("/:id", isAuthenticated, async (req: any, res) => {
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

// Get channel messages
channelsRouter.get("/:id/messages", isAuthenticated, async (req: any, res) => {
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

// Post message to channel
channelsRouter.post("/:id/messages", isAuthenticated, async (req: any, res) => {
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
    res.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});
