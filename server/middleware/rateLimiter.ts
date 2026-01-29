import type { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

const stores: Map<string, RateLimitStore> = new Map();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  });
}, 60000);

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 60000, // 1 minute default
    max = 100, // 100 requests per window default
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.claims?.sub;
      return userId || req.ip || req.socket.remoteAddress || "unknown";
    },
  } = options;

  const storeName = `${windowMs}-${max}`;
  if (!stores.has(storeName)) {
    stores.set(storeName, {});
  }
  const store = stores.get(storeName)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, max - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(resetTime));

    if (store[key].count > max) {
      res.set("Retry-After", String(resetTime));
      return res.status(429).json({ message, retryAfter: resetTime });
    }

    next();
  };
}

// Pre-configured rate limiters for different use cases
export const generalLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  message: "Too many requests, please try again later.",
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

export const searchLimiter = createRateLimiter({
  windowMs: 60000,
  max: 30, // 30 searches per minute
  message: "Too many search requests, please slow down.",
});

export const createLimiter = createRateLimiter({
  windowMs: 60000,
  max: 20, // 20 creates per minute
  message: "Too many creation requests, please slow down.",
});

export const messageLimiter = createRateLimiter({
  windowMs: 60000,
  max: 30, // 30 messages per minute
  message: "You're sending messages too quickly. Please slow down.",
});
