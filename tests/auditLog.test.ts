import { describe, it, expect, beforeEach } from "vitest";
import {
  logAudit,
  getUserAuditLogs,
  getResourceAuditLogs,
  exportAuditLogs,
} from "../server/services/auditLog";

describe("Audit Logging Service", () => {
  beforeEach(() => {
    // Note: In a real test, we'd want to reset the audit log store
    // For now, we'll just test that logs accumulate
  });

  it("should log audit entries", () => {
    logAudit({
      userId: "test-user-1",
      action: "report_create",
      resourceType: "trip_report",
      resourceId: 123,
      details: { substance: "Psilocybin" },
    });

    const logs = getUserAuditLogs("test-user-1", 10);
    expect(logs.length).toBeGreaterThan(0);

    const latestLog = logs[0];
    expect(latestLog.userId).toBe("test-user-1");
    expect(latestLog.action).toBe("report_create");
    expect(latestLog.resourceType).toBe("trip_report");
    expect(latestLog.resourceId).toBe(123);
    expect(latestLog.details?.substance).toBe("Psilocybin");
    expect(latestLog.timestamp).toBeInstanceOf(Date);
  });

  it("should retrieve logs by user", () => {
    const testUserId = `user-${Date.now()}`;

    logAudit({
      userId: testUserId,
      action: "report_create",
      resourceType: "trip_report",
    });

    logAudit({
      userId: testUserId,
      action: "mood_create",
      resourceType: "mood_entry",
    });

    logAudit({
      userId: "other-user",
      action: "report_create",
      resourceType: "trip_report",
    });

    const userLogs = getUserAuditLogs(testUserId, 100);
    expect(userLogs.every((log) => log.userId === testUserId)).toBe(true);
    expect(userLogs.length).toBeGreaterThanOrEqual(2);
  });

  it("should retrieve logs by resource", () => {
    const resourceId = Date.now();

    logAudit({
      userId: "user1",
      action: "report_create",
      resourceType: "trip_report",
      resourceId,
    });

    logAudit({
      userId: "user2",
      action: "report_update",
      resourceType: "trip_report",
      resourceId,
    });

    const resourceLogs = getResourceAuditLogs("trip_report", resourceId, 100);
    expect(resourceLogs.every((log) => log.resourceId === resourceId)).toBe(true);
    expect(resourceLogs.length).toBeGreaterThanOrEqual(2);
  });

  it("should export all logs for a user", () => {
    const exportUserId = `export-user-${Date.now()}`;

    logAudit({
      userId: exportUserId,
      action: "data_export",
      resourceType: "user_data",
    });

    const exportedLogs = exportAuditLogs(exportUserId);
    expect(exportedLogs.every((log) => log.userId === exportUserId)).toBe(true);
  });

  it("should include IP and user agent when provided", () => {
    const testUserId = `ip-test-${Date.now()}`;

    logAudit({
      userId: testUserId,
      action: "user_login",
      resourceType: "session",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 Test",
    });

    const logs = getUserAuditLogs(testUserId, 10);
    const latestLog = logs[0];
    expect(latestLog.ipAddress).toBe("192.168.1.1");
    expect(latestLog.userAgent).toBe("Mozilla/5.0 Test");
  });
});
