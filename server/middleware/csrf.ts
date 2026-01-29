import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// CSRF token store (in production, consider using Redis)
const tokenStore = new Map<string, { token: string; expiresAt: number }>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  tokenStore.forEach((value, key) => {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  });
}, 5 * 60000);

// Generate a CSRF token for a session
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(sessionId, {
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

// Verify CSRF token
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);
  if (!stored) return false;
  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

// Middleware to validate CSRF token on state-changing requests
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Get session ID
  const sessionId = (req as any).sessionID || (req as any).user?.claims?.sub;
  if (!sessionId) {
    return next(); // Skip if no session (handled by auth middleware)
  }

  // Get token from header or body
  const token = req.headers["x-csrf-token"] as string || req.body?._csrf;

  // In development or if CSRF is not configured, skip
  if (process.env.NODE_ENV !== "production" || process.env.DISABLE_CSRF === "true") {
    return next();
  }

  if (!token) {
    return res.status(403).json({ message: "CSRF token missing" });
  }

  if (!verifyCsrfToken(sessionId, token)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
}

// Endpoint to get a CSRF token
export function csrfTokenHandler(req: Request, res: Response) {
  const sessionId = (req as any).sessionID || (req as any).user?.claims?.sub;
  if (!sessionId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = generateCsrfToken(sessionId);
  res.json({ csrfToken: token });
}
