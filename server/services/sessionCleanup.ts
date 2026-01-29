import { db } from "../db";
import { sql } from "drizzle-orm";

// Clean up expired sessions from the database
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.execute(
      sql`DELETE FROM sessions WHERE expire < NOW()`
    );
    const deletedCount = (result as any).rowCount || 0;

    if (deletedCount > 0) {
      console.log(`[Session Cleanup] Deleted ${deletedCount} expired sessions`);
    }

    return deletedCount;
  } catch (error) {
    console.error("[Session Cleanup] Error cleaning up sessions:", error);
    return 0;
  }
}

// Start periodic session cleanup
export function startSessionCleanup(intervalMs = 60 * 60 * 1000): NodeJS.Timeout {
  // Run immediately on startup
  cleanupExpiredSessions();

  // Run periodically (default: every hour)
  const interval = setInterval(() => {
    cleanupExpiredSessions();
  }, intervalMs);

  console.log(`[Session Cleanup] Started with interval: ${intervalMs}ms`);

  return interval;
}

// Get session statistics
export async function getSessionStats(): Promise<{
  total: number;
  expired: number;
  active: number;
}> {
  try {
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM sessions`
    );
    const expiredResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM sessions WHERE expire < NOW()`
    );

    const total = parseInt((totalResult as any).rows?.[0]?.count || "0", 10);
    const expired = parseInt((expiredResult as any).rows?.[0]?.count || "0", 10);

    return {
      total,
      expired,
      active: total - expired,
    };
  } catch (error) {
    console.error("[Session Cleanup] Error getting session stats:", error);
    return { total: 0, expired: 0, active: 0 };
  }
}
