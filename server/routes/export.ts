// Export routes (data export, therapist reports)
import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const exportRouter = Router();

// Export user data as JSON
exportRouter.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const format = req.query.format as string || "json";

    const reports = await storage.getUserTripReports(userId);
    const user = await storage.getUser(userId);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      },
      totalReports: reports.length,
      reports: reports.map((report) => ({
        id: report.id,
        substance: report.substance,
        amount: report.amount,
        setMindset: report.setMindset,
        setting: report.setting,
        experience: report.experience,
        tags: report.tags,
        createdAt: report.createdAt,
      })),
    };

    if (format === "json") {
      const jsonString = JSON.stringify(exportData, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="trip-reports-${new Date().toISOString().split("T")[0]}.json"`);
      res.setHeader("Content-Length", Buffer.byteLength(jsonString));
      res.status(200).send(jsonString);
    } else {
      res.status(400).json({ message: "Unsupported format. Use: json" });
    }
  } catch (error) {
    console.error("Error exporting reports:", error);
    res.status(500).json({ message: "Failed to export reports" });
  }
});

// Therapist export route - professional summary format
exportRouter.get("/therapist", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const reports = await storage.getUserTripReports(userId);
    const user = await storage.getUser(userId);
    const moodEntries = await storage.getUserMoodEntries(userId, 90);
    const patterns = await storage.getUserPatterns(userId);

    // Calculate summary statistics
    const substanceCounts: Record<string, number> = {};
    reports.forEach((r) => {
      substanceCounts[r.substance] = (substanceCounts[r.substance] || 0) + 1;
    });

    const avgMood = moodEntries.length > 0
      ? (moodEntries.reduce((sum, m) => sum + m.level, 0) / moodEntries.length).toFixed(1)
      : "N/A";

    const dateRange = reports.length > 0
      ? {
          start: reports[reports.length - 1]?.createdAt,
          end: reports[0]?.createdAt,
        }
      : null;

    const therapistReport = {
      generatedAt: new Date().toISOString(),
      disclaimer: "This report is generated for informational purposes to support therapeutic discussion. It should be interpreted in the context of a professional healthcare relationship.",
      clientInfo: {
        name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Anonymous",
      },
      summary: {
        totalExperiences: reports.length,
        dateRange: dateRange ? {
          from: dateRange.start,
          to: dateRange.end,
        } : null,
        substancesUsed: Object.entries(substanceCounts).map(([substance, count]) => ({
          substance,
          frequency: count,
        })),
        averageMoodScore: avgMood,
        moodEntriesCount: moodEntries.length,
      },
      experienceDetails: reports.slice(0, 10).map((report) => ({
        date: report.createdAt,
        substance: report.substance,
        dosage: report.amount,
        setMindset: report.setMindset,
        setting: report.setting,
        experienceSummary: report.experience?.slice(0, 500) + (report.experience && report.experience.length > 500 ? "..." : ""),
      })),
      patternInsights: patterns.insights || [],
      moodTrends: {
        recentEntries: moodEntries.slice(0, 14).map((m) => ({
          date: m.createdAt,
          level: m.level,
          notes: m.notes,
        })),
      },
    };

    const jsonString = JSON.stringify(therapistReport, null, 2);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="therapist-report-${new Date().toISOString().split("T")[0]}.json"`);
    res.status(200).send(jsonString);
  } catch (error) {
    console.error("Error generating therapist export:", error);
    res.status(500).json({ message: "Failed to generate therapist export" });
  }
});
