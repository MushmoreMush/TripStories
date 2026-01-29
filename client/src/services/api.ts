// Centralized API service layer
// Provides typed API calls for all endpoints

import { apiRequest } from "@/lib/queryClient";
import type {
  User,
  TripReport,
  TripReportWithUser,
  Friendship,
  FriendshipWithUsers,
  Comment,
  ThreadedComment,
  ReactionCount,
  ReactionType,
  MoodEntry,
  IntegrationNote,
  TimelineReflection,
  Badge,
  Channel,
  ChannelMessageWithUser,
  FounderPostWithUser,
} from "@shared/schema";
import type { TripReportFormValues, MoodEntryFormValues, ProfileFormValues } from "@shared/formSchemas";

// Helper function to parse JSON response
async function parseResponse<T>(response: Response): Promise<T> {
  return response.json();
}

// Report filters type
export interface ReportFilters {
  substance?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  friendId?: string;
}

// ==================== AUTH API ====================
export const authApi = {
  getUser: async (): Promise<User | null> => {
    const response = await fetch("/api/auth/user", { credentials: "include" });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  },

  isFounder: async (): Promise<boolean> => {
    const response = await fetch("/api/auth/is-founder", { credentials: "include" });
    if (!response.ok) return false;
    const data = await response.json();
    return data.isFounder;
  },
};

// ==================== REPORTS API ====================
export const reportsApi = {
  getAll: async (filters?: ReportFilters): Promise<TripReportWithUser[]> => {
    const params = new URLSearchParams();
    if (filters?.substance) params.set("substance", filters.substance);
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    if (filters?.search) params.set("search", filters.search);

    const url = `/api/reports${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },

  getById: async (id: number): Promise<TripReport> => {
    const response = await fetch(`/api/reports/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  },

  create: async (data: TripReportFormValues): Promise<TripReport> => {
    const response = await apiRequest("POST", "/api/reports", data);
    return parseResponse(response);
  },

  update: async (id: number, data: Partial<TripReportFormValues>): Promise<TripReport> => {
    const response = await apiRequest("PATCH", `/api/reports/${id}`, data);
    return parseResponse(response);
  },

  getSubstances: async (): Promise<string[]> => {
    const response = await fetch("/api/reports/substances", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch substances");
    return response.json();
  },

  // Comments
  getComments: async (reportId: number): Promise<ThreadedComment[]> => {
    const response = await fetch(`/api/reports/${reportId}/comments`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  addComment: async (reportId: number, content: string, parentId?: number): Promise<Comment> => {
    const response = await apiRequest("POST", `/api/reports/${reportId}/comments`, { content, parentId });
    return parseResponse(response);
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiRequest("DELETE", `/api/comments/${commentId}`);
  },

  // Reactions
  getReactions: async (reportId: number): Promise<ReactionCount[]> => {
    const response = await fetch(`/api/reports/${reportId}/reactions`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch reactions");
    return response.json();
  },

  toggleReaction: async (reportId: number, type: ReactionType): Promise<{ added: boolean }> => {
    const response = await apiRequest("POST", `/api/reports/${reportId}/reactions`, { type });
    return parseResponse(response);
  },
};

// ==================== SOCIAL API ====================
export const socialApi = {
  getFriends: async (): Promise<User[]> => {
    const response = await fetch("/api/friends", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch friends");
    return response.json();
  },

  getPendingRequests: async (): Promise<FriendshipWithUsers[]> => {
    const response = await fetch("/api/friends/pending", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch pending requests");
    return response.json();
  },

  getSentRequests: async (): Promise<FriendshipWithUsers[]> => {
    const response = await fetch("/api/friends/sent", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch sent requests");
    return response.json();
  },

  sendRequest: async (addresseeId: string): Promise<Friendship> => {
    const response = await apiRequest("POST", "/api/friends/request", { addresseeId });
    return parseResponse(response);
  },

  respondToRequest: async (requestId: number, status: "accepted" | "rejected"): Promise<Friendship> => {
    const response = await apiRequest("PATCH", `/api/friends/request/${requestId}`, { status });
    return parseResponse(response);
  },

  deleteFriendship: async (friendshipId: number): Promise<void> => {
    await apiRequest("DELETE", `/api/friendships/${friendshipId}`);
  },

  getFeed: async (filters?: ReportFilters): Promise<TripReportWithUser[]> => {
    const params = new URLSearchParams();
    if (filters?.substance) params.set("substance", filters.substance);
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    if (filters?.search) params.set("search", filters.search);

    const url = `/api/feed${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch feed");
    return response.json();
  },

  getDiscoveryFeed: async (filters?: ReportFilters): Promise<TripReportWithUser[]> => {
    const params = new URLSearchParams();
    if (filters?.substance) params.set("substance", filters.substance);
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.friendId) params.set("friendId", filters.friendId);

    const url = `/api/discover${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch discovery feed");
    return response.json();
  },
};

// ==================== USER API ====================
export const userApi = {
  updateProfile: async (data: ProfileFormValues): Promise<User> => {
    const response = await apiRequest("PATCH", "/api/profile", data);
    return parseResponse(response);
  },

  updateOnboarding: async (step: number, completed: boolean): Promise<User> => {
    const response = await apiRequest("POST", "/api/user/onboarding", { step, completed });
    return parseResponse(response);
  },

  dismissTooltip: async (tooltipId: string): Promise<User> => {
    const response = await apiRequest("POST", "/api/user/tooltips/dismiss", { tooltipId });
    return parseResponse(response);
  },

  search: async (query: string): Promise<User[]> => {
    if (query.length < 2) return [];
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to search users");
    return response.json();
  },
};

// ==================== MOOD API ====================
export const moodApi = {
  getEntries: async (daysBack?: number): Promise<MoodEntry[]> => {
    const url = daysBack ? `/api/mood?days=${daysBack}` : "/api/mood";
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch mood entries");
    return response.json();
  },

  create: async (data: MoodEntryFormValues): Promise<MoodEntry> => {
    const response = await apiRequest("POST", "/api/mood", data);
    return parseResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/mood/${id}`);
  },

  import: async (entries: Array<{ date?: string; level: number; notes?: string }>): Promise<{ imported: number; skipped: number; total: number }> => {
    const response = await apiRequest("POST", "/api/import/mood", { entries });
    return parseResponse(response);
  },
};

// ==================== ANALYTICS API ====================
export const analyticsApi = {
  getInsights: async () => {
    const response = await fetch("/api/insights", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch insights");
    return response.json();
  },

  getPatterns: async () => {
    const response = await fetch("/api/patterns", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch patterns");
    return response.json();
  },

  getCorrelations: async () => {
    const response = await fetch("/api/correlations", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch correlations");
    return response.json();
  },

  getTimingSuggestions: async () => {
    const response = await fetch("/api/suggestions/timing", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch timing suggestions");
    return response.json();
  },

  getStreak: async () => {
    const response = await fetch("/api/streak", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch streak");
    return response.json();
  },
};

// ==================== INTEGRATION API ====================
export const integrationApi = {
  getNote: async (reportId: number): Promise<IntegrationNote | null> => {
    const response = await fetch(`/api/integration/${reportId}`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch integration note");
    return response.json();
  },

  saveNote: async (data: { reportId: number; insightsCarriedForward?: string; dailyLifeImpact?: string; lessonsLearned?: string }): Promise<IntegrationNote> => {
    const response = await apiRequest("POST", "/api/integration", data);
    return parseResponse(response);
  },

  getPendingReports: async (): Promise<TripReport[]> => {
    const response = await fetch("/api/integration/pending", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch pending integrations");
    return response.json();
  },

  getReflections: async (): Promise<TimelineReflection[]> => {
    const response = await fetch("/api/reflections", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch reflections");
    return response.json();
  },

  saveReflection: async (data: { periodType: string; periodStart: string; content: string }): Promise<TimelineReflection> => {
    const response = await apiRequest("POST", "/api/reflections", data);
    return parseResponse(response);
  },
};

// ==================== BADGES API ====================
export const badgesApi = {
  getAll: async (): Promise<Badge[]> => {
    const response = await fetch("/api/badges", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch badges");
    return response.json();
  },

  check: async (): Promise<{ newBadges: Badge[] }> => {
    const response = await apiRequest("POST", "/api/badges/check", {});
    return parseResponse(response);
  },
};

// ==================== CHANNELS API ====================
export const channelsApi = {
  getAll: async (): Promise<Channel[]> => {
    const response = await fetch("/api/channels", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch channels");
    return response.json();
  },

  getById: async (id: number): Promise<Channel> => {
    const response = await fetch(`/api/channels/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch channel");
    return response.json();
  },

  getMessages: async (channelId: number, limit?: number): Promise<ChannelMessageWithUser[]> => {
    const url = limit ? `/api/channels/${channelId}/messages?limit=${limit}` : `/api/channels/${channelId}/messages`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },

  sendMessage: async (channelId: number, content: string): Promise<ChannelMessageWithUser> => {
    const response = await apiRequest("POST", `/api/channels/${channelId}/messages`, { content });
    return parseResponse(response);
  },
};

// ==================== FOUNDER API ====================
export const founderApi = {
  getPosts: async (): Promise<FounderPostWithUser[]> => {
    const response = await fetch("/api/founder-posts", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch founder posts");
    return response.json();
  },

  createPost: async (data: { mediaUrl: string; mediaType: "image" | "video"; caption?: string }): Promise<FounderPostWithUser> => {
    const response = await apiRequest("POST", "/api/founder-posts", data);
    return parseResponse(response);
  },
};

// ==================== EXPORT API ====================
export const exportApi = {
  downloadJson: () => {
    window.location.href = "/api/export?format=json";
  },

  downloadTherapistReport: () => {
    window.location.href = "/api/export/therapist";
  },
};

// Combined API object for convenience
export const api = {
  auth: authApi,
  reports: reportsApi,
  social: socialApi,
  user: userApi,
  mood: moodApi,
  analytics: analyticsApi,
  integration: integrationApi,
  badges: badgesApi,
  channels: channelsApi,
  founder: founderApi,
  export: exportApi,
};

export default api;
