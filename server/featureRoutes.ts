// New Feature Routes for TripStories
import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { analyzeReport, checkSubstanceInteraction, getSubstanceInteractions, substanceInteractionData } from "./services/aiAnalysis";
import { z } from "zod";

export function registerFeatureRoutes(app: Express) {
  // =====================
  // AI ANALYSIS ROUTES
  // =====================

  // Analyze a trip report
  app.post("/api/reports/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.id);

      const report = await storage.getTripReportById(reportId, userId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const analysis = analyzeReport(
        report.experience,
        report.setMindset,
        report.setting
      );

      // Save analysis to database
      const savedAnalysis = await storage.saveTripAnalysis(reportId, analysis);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing report:", error);
      res.status(500).json({ message: "Failed to analyze report" });
    }
  });

  // Get analysis for a report
  app.get("/api/reports/:id/analysis", isAuthenticated, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const analysis = await storage.getTripAnalysis(reportId);
      res.json(analysis || null);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Alternative analysis routes (matching AIAnalysis component)
  app.get("/api/analysis/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const analysis = await storage.getTripAnalysis(reportId);
      res.json(analysis || null);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.post("/api/analysis/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.reportId);

      // Get report or use provided data
      let experience = req.body.experience;
      let setMindset = req.body.setMindset;
      let setting = req.body.setting;

      if (!experience) {
        const report = await storage.getTripReportById(reportId, userId);
        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }
        experience = report.experience;
        setMindset = report.setMindset;
        setting = report.setting;
      }

      const analysis = analyzeReport(experience, setMindset, setting);
      const savedAnalysis = await storage.saveTripAnalysis(reportId, analysis);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing report:", error);
      res.status(500).json({ message: "Failed to analyze report" });
    }
  });

  // =====================
  // SUBSTANCE INTERACTION ROUTES
  // =====================

  // Check interaction between two substances
  app.get("/api/interactions/check", isAuthenticated, async (req: any, res) => {
    try {
      const { substance1, substance2 } = req.query;

      if (!substance1 || !substance2) {
        return res.status(400).json({ message: "Both substances required" });
      }

      const interaction = checkSubstanceInteraction(
        substance1 as string,
        substance2 as string
      );

      res.json({ interaction });
    } catch (error) {
      console.error("Error checking interaction:", error);
      res.status(500).json({ message: "Failed to check interaction" });
    }
  });

  // Get all interactions for a substance
  app.get("/api/interactions/:substance", isAuthenticated, async (req: any, res) => {
    try {
      const interactions = getSubstanceInteractions(req.params.substance);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  // Get all known interactions
  app.get("/api/interactions", isAuthenticated, async (req: any, res) => {
    try {
      res.json(substanceInteractionData);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  // =====================
  // EMERGENCY CONTACTS ROUTES
  // =====================

  app.get("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contact = await storage.createEmergencyContact(userId, req.body);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteEmergencyContact(parseInt(req.params.id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // =====================
  // TRIP SITTER ROUTES
  // =====================

  app.get("/api/trip-sitter/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveTripSitterSession(userId);
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post("/api/trip-sitter/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createTripSitterSession(userId, req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  app.post("/api/trip-sitter/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.tripSitterCheckIn(userId);
      res.json(session);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post("/api/trip-sitter/end", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.endTripSitterSession(userId);
      res.json(session);
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // =====================
  // PRE-TRIP CHECKLIST ROUTES
  // =====================

  app.get("/api/checklists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checklists = await storage.getChecklists(userId);
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  app.post("/api/checklists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checklist = await storage.createChecklist(userId, req.body);
      res.status(201).json(checklist);
    } catch (error) {
      console.error("Error creating checklist:", error);
      res.status(500).json({ message: "Failed to create checklist" });
    }
  });

  app.post("/api/checklists/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completion = await storage.completeChecklist(
        userId,
        parseInt(req.params.id),
        req.body.completedItems,
        req.body.reportId
      );
      res.json(completion);
    } catch (error) {
      console.error("Error completing checklist:", error);
      res.status(500).json({ message: "Failed to complete checklist" });
    }
  });

  app.delete("/api/checklists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteChecklistItem(parseInt(req.params.id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  app.get("/api/checklists/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getChecklistProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/checklists/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.saveChecklistProgress(userId, req.body.completedItems);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving progress:", error);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  // =====================
  // DIRECT MESSAGING ROUTES
  // =====================

  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:friendId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getDirectMessages(userId, req.params.friendId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const message = await storage.sendDirectMessage(userId, req.body.receiverId, req.body.content);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/messages/:friendId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markMessagesAsRead(userId, req.params.friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.get("/api/messages/unread/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // =====================
  // GROUP EXPERIENCE ROUTES
  // =====================

  app.get("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groups = await storage.getGroupExperiences(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const group = await storage.getGroupExperience(parseInt(req.params.id), userId);
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const group = await storage.createGroupExperience(userId, req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.post("/api/groups/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const participant = await storage.inviteToGroup(
        parseInt(req.params.id),
        userId,
        req.body.inviteeId
      );
      res.json(participant);
    } catch (error) {
      console.error("Error inviting to group:", error);
      res.status(500).json({ message: "Failed to invite" });
    }
  });

  app.post("/api/groups/:id/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.linkReportToGroup(
        parseInt(req.params.id),
        userId,
        req.body.reportId
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error linking report:", error);
      res.status(500).json({ message: "Failed to link report" });
    }
  });

  // =====================
  // MENTORSHIP ROUTES
  // =====================

  app.get("/api/mentorship/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getMentorshipProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/mentorship/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.upsertMentorshipProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/mentorship/mentors", isAuthenticated, async (req: any, res) => {
    try {
      const mentors = await storage.getAvailableMentors();
      res.json(mentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      res.status(500).json({ message: "Failed to fetch mentors" });
    }
  });

  app.get("/api/mentorship/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getMentorshipConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/mentorship/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.requestMentorship(userId, req.body.mentorId);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error requesting mentorship:", error);
      res.status(500).json({ message: "Failed to request mentorship" });
    }
  });

  app.post("/api/mentorship/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.respondToMentorship(
        parseInt(req.params.id),
        userId,
        req.body.accept
      );
      res.json(connection);
    } catch (error) {
      console.error("Error responding to mentorship:", error);
      res.status(500).json({ message: "Failed to respond" });
    }
  });

  // =====================
  // WEEKLY CHALLENGES ROUTES
  // =====================

  app.get("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const challenges = await storage.getCurrentChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get("/api/challenges/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserChallengeProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/challenges/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.updateChallengeProgress(
        userId,
        parseInt(req.params.id),
        req.body.progress
      );
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // =====================
  // CUSTOM BADGES ROUTES
  // =====================

  app.get("/api/custom-badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const badges = await storage.getCustomBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/custom-badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const badge = await storage.createCustomBadge(userId, req.body);
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  // =====================
  // MILESTONES ROUTES
  // =====================

  app.get("/api/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestones = await storage.getMilestones(userId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.get("/api/milestones/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestones = await storage.getUpcomingMilestones(userId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones/:id/celebrate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.celebrateMilestone(parseInt(req.params.id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error celebrating milestone:", error);
      res.status(500).json({ message: "Failed to celebrate" });
    }
  });

  // =====================
  // USER SETTINGS ROUTES
  // =====================

  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // =====================
  // PDF EXPORT ROUTE
  // =====================

  app.get("/api/export/pdf/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = parseInt(req.params.reportId);

      const report = await storage.getTripReportById(reportId, userId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const user = await storage.getUser(userId);
      const analysis = await storage.getTripAnalysis(reportId);

      // Generate PDF-ready data structure
      const pdfData = {
        title: `Trip Report - ${report.substance}`,
        date: report.createdAt,
        user: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous'
        },
        report: {
          substance: report.substance,
          amount: report.amount,
          setMindset: report.setMindset,
          setting: report.setting,
          experience: report.experience,
          tags: report.tags,
          reflections: {
            whatSurprised: report.whatSurprised,
            lessonsToRemember: report.lessonsToRemember,
            dailyLifeApplication: report.dailyLifeApplication,
            weeklyIntention: report.weeklyIntention
          }
        },
        analysis: analysis ? {
          themes: analysis.themes,
          sentimentScore: analysis.sentimentScore,
          keyInsights: analysis.keyInsights,
          suggestedIntegration: analysis.suggestedIntegration
        } : null,
        generatedAt: new Date().toISOString()
      };

      res.json(pdfData);
    } catch (error) {
      console.error("Error generating PDF data:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // =====================
  // CALENDAR EXPORT ROUTE
  // =====================

  app.get("/api/export/calendar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getUserTripReports(userId);

      // Generate iCal format
      const events = reports.map(report => ({
        uid: `report-${report.id}@tripstories`,
        summary: `${report.substance} Experience`,
        description: report.experience.substring(0, 200),
        start: report.createdAt,
        categories: report.tags || []
      }));

      const ical = generateICalendar(events);

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="trip-experiences.ics"');
      res.send(ical);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      res.status(500).json({ message: "Failed to export calendar" });
    }
  });

  // =====================
  // COMMUNITY BENCHMARKS ROUTE
  // =====================

  app.get("/api/benchmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const benchmarks = await storage.getCommunityBenchmarks(userId);
      res.json(benchmarks);
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
      res.status(500).json({ message: "Failed to fetch benchmarks" });
    }
  });

  // =====================
  // LONG-TERM OUTCOMES ROUTE
  // =====================

  app.get("/api/outcomes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outcomes = await storage.getLongTermOutcomes(userId);
      res.json(outcomes);
    } catch (error) {
      console.error("Error fetching outcomes:", error);
      res.status(500).json({ message: "Failed to fetch outcomes" });
    }
  });

  // =====================
  // INTEGRATION SUCCESS SCORE
  // =====================

  app.get("/api/integration-score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const score = await storage.getIntegrationScore(userId);
      res.json(score);
    } catch (error) {
      console.error("Error fetching score:", error);
      res.status(500).json({ message: "Failed to fetch score" });
    }
  });
}

// Helper function to generate iCalendar format
function generateICalendar(events: Array<{
  uid: string;
  summary: string;
  description: string;
  start: Date | null;
  categories: string[];
}>): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripStories//Trip Reports//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const event of events) {
    if (!event.start) continue;

    const startDate = new Date(event.start);
    const dateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART:${dateStr}`);
    lines.push(`DTEND:${dateStr}`);
    lines.push(`SUMMARY:${escapeICalText(event.summary)}`);
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    if (event.categories.length > 0) {
      lines.push(`CATEGORIES:${event.categories.join(',')}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
