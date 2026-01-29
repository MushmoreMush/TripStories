import type { Request } from "express";

export type AuditAction =
  | "report_create"
  | "report_update"
  | "report_delete"
  | "comment_create"
  | "comment_delete"
  | "reaction_add"
  | "reaction_remove"
  | "friendship_request"
  | "friendship_accept"
  | "friendship_reject"
  | "friendship_delete"
  | "profile_update"
  | "mood_create"
  | "mood_delete"
  | "message_create"
  | "user_login"
  | "user_logout"
  | "data_export";

export interface AuditLogEntry {
  id?: number;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory audit log storage (in production, store in database or external service)
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000;

export function logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
    id: auditLogs.length + 1,
  };

  auditLogs.push(logEntry);

  // Trim old logs if over limit
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.splice(0, auditLogs.length - MAX_LOGS);
  }

  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.log("[AUDIT]", JSON.stringify(logEntry));
  }
}

export function logAuditFromRequest(
  req: Request,
  action: AuditAction,
  resourceType: string,
  resourceId?: string | number,
  details?: Record<string, any>
) {
  const userId = (req as any).user?.claims?.sub;
  if (!userId) return;

  logAudit({
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  });
}

// Get audit logs for a user
export function getUserAuditLogs(userId: string, limit = 100): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .slice(-limit)
    .reverse();
}

// Get audit logs for a resource
export function getResourceAuditLogs(
  resourceType: string,
  resourceId: string | number,
  limit = 100
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.resourceType === resourceType && log.resourceId === resourceId)
    .slice(-limit)
    .reverse();
}

// Get recent audit logs
export function getRecentAuditLogs(limit = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit).reverse();
}

// Export audit logs for compliance
export function exportAuditLogs(userId?: string): AuditLogEntry[] {
  if (userId) {
    return auditLogs.filter((log) => log.userId === userId);
  }
  return [...auditLogs];
}
