// Social/Friends routes
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const socialRouter = Router();

// Get all friends
socialRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const friends = await storage.getFriends(userId);
    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

// Get pending friend requests
socialRouter.get("/pending", isAuthenticated, async (req: any, res) => {
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

// Get sent friend requests
socialRouter.get("/sent", isAuthenticated, async (req: any, res) => {
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

// Send friend request
socialRouter.post("/request", isAuthenticated, async (req: any, res) => {
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

// Respond to friend request
socialRouter.patch("/request/:id", isAuthenticated, async (req: any, res) => {
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

// Delete friendship
socialRouter.delete("/:id", isAuthenticated, async (req: any, res) => {
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

// Friends feed route
socialRouter.get("/feed", isAuthenticated, async (req: any, res) => {
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

// Discovery feed route
socialRouter.get("/discover", isAuthenticated, async (req: any, res) => {
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
