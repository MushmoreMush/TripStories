// Analytics routes (insights, patterns, correlations, suggestions)
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const analyticsRouter = Router();

// Get user insights
analyticsRouter.get("/insights", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const insights = await storage.getUserInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// Get user patterns
analyticsRouter.get("/patterns", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const patterns = await storage.getUserPatterns(userId);
    res.json(patterns);
  } catch (error) {
    console.error("Error fetching patterns:", error);
    res.status(500).json({ message: "Failed to fetch patterns" });
  }
});

// Correlation analysis route - substance/setting vs mood outcomes
analyticsRouter.get("/correlations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const reports = await storage.getUserTripReports(userId);
    const moodEntries = await storage.getUserMoodEntries(userId, 90);

    // Build substance-mood correlation data
    const substanceMoodData: { substance: string; avgMoodBefore: number; avgMoodAfter: number; count: number }[] = [];
    const substanceGroups: Record<string, { before: number[]; after: number[] }> = {};

    for (const report of reports) {
      if (!report.createdAt) continue;
      const reportDate = new Date(report.createdAt);

      // Find mood entries within 3 days before and 3 days after the experience
      const moodsBefore = moodEntries.filter((m) => {
        const moodDate = new Date(m.createdAt!);
        const diff = (reportDate.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 3;
      });

      const moodsAfter = moodEntries.filter((m) => {
        const moodDate = new Date(m.createdAt!);
        const diff = (moodDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 1 && diff <= 7;
      });

      if (moodsBefore.length > 0 || moodsAfter.length > 0) {
        if (!substanceGroups[report.substance]) {
          substanceGroups[report.substance] = { before: [], after: [] };
        }
        if (moodsBefore.length > 0) {
          const avgBefore = moodsBefore.reduce((sum, m) => sum + m.level, 0) / moodsBefore.length;
          substanceGroups[report.substance].before.push(avgBefore);
        }
        if (moodsAfter.length > 0) {
          const avgAfter = moodsAfter.reduce((sum, m) => sum + m.level, 0) / moodsAfter.length;
          substanceGroups[report.substance].after.push(avgAfter);
        }
      }
    }

    for (const [substance, data] of Object.entries(substanceGroups)) {
      const avgBefore = data.before.length > 0 ? data.before.reduce((a, b) => a + b, 0) / data.before.length : 0;
      const avgAfter = data.after.length > 0 ? data.after.reduce((a, b) => a + b, 0) / data.after.length : 0;
      substanceMoodData.push({
        substance,
        avgMoodBefore: Math.round(avgBefore * 10) / 10,
        avgMoodAfter: Math.round(avgAfter * 10) / 10,
        count: Math.max(data.before.length, data.after.length),
      });
    }

    // Build setting-mood correlation data
    const settingMoodData: { setting: string; avgMood: number; count: number }[] = [];
    const settingGroups: Record<string, number[]> = {};

    for (const report of reports) {
      if (!report.setting || !report.createdAt) continue;
      const reportDate = new Date(report.createdAt);

      // Find mood entries within 7 days after the experience
      const moodsAfter = moodEntries.filter((m) => {
        const moodDate = new Date(m.createdAt!);
        const diff = (moodDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 1 && diff <= 7;
      });

      if (moodsAfter.length > 0) {
        const settingKey = report.setting.toLowerCase().slice(0, 30);
        if (!settingGroups[settingKey]) {
          settingGroups[settingKey] = [];
        }
        const avgMood = moodsAfter.reduce((sum, m) => sum + m.level, 0) / moodsAfter.length;
        settingGroups[settingKey].push(avgMood);
      }
    }

    for (const [setting, moods] of Object.entries(settingGroups)) {
      if (moods.length >= 1) {
        settingMoodData.push({
          setting: setting.charAt(0).toUpperCase() + setting.slice(1),
          avgMood: Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10,
          count: moods.length,
        });
      }
    }

    // Sort by count descending
    substanceMoodData.sort((a, b) => b.count - a.count);
    settingMoodData.sort((a, b) => b.count - a.count);

    res.json({
      substanceMood: substanceMoodData.slice(0, 10),
      settingMood: settingMoodData.slice(0, 8),
      totalReports: reports.length,
      totalMoodEntries: moodEntries.length,
    });
  } catch (error) {
    console.error("Error generating correlations:", error);
    res.status(500).json({ message: "Failed to generate correlations" });
  }
});

// Smart timing suggestions route
analyticsRouter.get("/suggestions/timing", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const moodEntries = await storage.getUserMoodEntries(userId, 30);
    const reports = await storage.getUserTripReports(userId);

    const suggestions: {
      type: "optimal" | "caution" | "insight";
      title: string;
      message: string;
    }[] = [];

    if (moodEntries.length === 0) {
      suggestions.push({
        type: "insight",
        title: "Start Tracking Your Mood",
        message: "Log your mood regularly to receive personalized timing suggestions based on your wellbeing patterns.",
      });
      return res.json({ suggestions });
    }

    // Calculate recent mood average (last 7 days) - moodEntries are sorted desc by createdAt
    const recentEntries = moodEntries.slice(0, 7);
    const recentAvg = recentEntries.reduce((sum, m) => sum + m.level, 0) / recentEntries.length;

    // Calculate overall average
    const overallAvg = moodEntries.reduce((sum, m) => sum + m.level, 0) / moodEntries.length;

    // Check for upward or downward mood trend
    const halfPoint = Math.floor(moodEntries.length / 2);
    const olderEntries = moodEntries.slice(halfPoint);
    const newerEntries = moodEntries.slice(0, halfPoint);
    const olderAvg = olderEntries.length > 0 ? olderEntries.reduce((sum, m) => sum + m.level, 0) / olderEntries.length : 0;
    const newerAvg = newerEntries.length > 0 ? newerEntries.reduce((sum, m) => sum + m.level, 0) / newerEntries.length : 0;
    const trendUp = newerAvg > olderAvg;

    // Get last experience date - reports are sorted descending by createdAt
    const lastExperience = reports.length > 0 && reports[0].createdAt ? new Date(reports[0].createdAt) : null;
    const daysSinceLastExperience = lastExperience
      ? Math.floor((Date.now() - lastExperience.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Generate suggestions based on data
    if (recentAvg >= 4) {
      suggestions.push({
        type: "optimal",
        title: "Mood is Positive",
        message: "Your recent mood has been consistently good (avg: " + recentAvg.toFixed(1) + "/5). If you're considering an experience, your current mental state appears stable.",
      });
    } else if (recentAvg <= 2.5) {
      suggestions.push({
        type: "caution",
        title: "Consider Waiting",
        message: "Your recent mood has been lower than usual (avg: " + recentAvg.toFixed(1) + "/5). Consider focusing on self-care and waiting for a more stable baseline before any experiences.",
      });
    }

    if (trendUp && moodEntries.length >= 10) {
      suggestions.push({
        type: "insight",
        title: "Positive Trend Detected",
        message: "Your mood has been trending upward recently. This is a good sign of emotional stability.",
      });
    } else if (!trendUp && moodEntries.length >= 10) {
      suggestions.push({
        type: "caution",
        title: "Mood Trend Declining",
        message: "Your mood has been trending downward. Consider what factors might be affecting your wellbeing before planning any experiences.",
      });
    }

    if (daysSinceLastExperience !== null && daysSinceLastExperience < 14) {
      suggestions.push({
        type: "insight",
        title: "Recent Experience",
        message: `Your last experience was ${daysSinceLastExperience} day${daysSinceLastExperience !== 1 ? 's' : ''} ago. Consider allowing adequate integration time between experiences.`,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: "insight",
        title: "Keep Tracking",
        message: "Continue logging your mood to receive more personalized suggestions. The more data we have, the better we can help you identify optimal timing.",
      });
    }

    res.json({ suggestions, stats: { recentAvg: recentAvg.toFixed(1), overallAvg: overallAvg.toFixed(1), daysSinceLastExperience } });
  } catch (error) {
    console.error("Error generating timing suggestions:", error);
    res.status(500).json({ message: "Failed to generate suggestions" });
  }
});

// Streak tracking route
analyticsRouter.get("/streak", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const entries = await storage.getUserMoodEntries(userId, 90);

    if (entries.length === 0) {
      return res.json({ currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckIn: null });
    }

    // Get unique dates with check-ins
    const checkInDates = new Set<string>();
    entries.forEach((entry) => {
      if (entry.createdAt) {
        const dateKey = new Date(entry.createdAt).toISOString().split("T")[0];
        checkInDates.add(dateKey);
      }
    });

    const sortedDates = Array.from(checkInDates).sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = today;

    // Start from today or yesterday if no check-in today
    if (checkInDates.has(today)) {
      currentStreak = 1;
      checkDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    } else if (checkInDates.has(yesterday)) {
      currentStreak = 1;
      checkDate = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    }

    // Count consecutive days
    while (checkInDates.has(checkDate)) {
      currentStreak++;
      const nextDate = new Date(new Date(checkDate).getTime() - 86400000);
      checkDate = nextDate.toISOString().split("T")[0];
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    sortedDates.reverse().forEach((dateStr) => {
      const date = new Date(dateStr);
      if (prevDate) {
        const diff = (date.getTime() - prevDate.getTime()) / 86400000;
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = date;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      currentStreak,
      longestStreak,
      totalCheckIns: entries.length,
      lastCheckIn: entries[0]?.createdAt || null,
      checkedInToday: checkInDates.has(today),
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    res.status(500).json({ message: "Failed to fetch streak" });
  }
});
