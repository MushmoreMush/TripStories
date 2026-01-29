import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRateLimiter } from "../server/middleware/rateLimiter";
import type { Request, Response, NextFunction } from "express";

describe("Rate Limiter Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let responseHeaders: Record<string, string>;

  beforeEach(() => {
    responseHeaders = {};
    mockReq = {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" } as any,
    };
    mockRes = {
      set: vi.fn((key: string, value: string) => {
        responseHeaders[key] = value;
        return mockRes as Response;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it("should allow requests within the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 5 });

    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(responseHeaders["X-RateLimit-Limit"]).toBe("5");
    expect(responseHeaders["X-RateLimit-Remaining"]).toBe("4");
  });

  it("should decrement remaining count on each request", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 3 });

    // First request
    limiter(mockReq as Request, mockRes as Response, mockNext);
    expect(responseHeaders["X-RateLimit-Remaining"]).toBe("2");

    // Second request
    limiter(mockReq as Request, mockRes as Response, mockNext);
    expect(responseHeaders["X-RateLimit-Remaining"]).toBe("1");

    // Third request
    limiter(mockReq as Request, mockRes as Response, mockNext);
    expect(responseHeaders["X-RateLimit-Remaining"]).toBe("0");
  });

  it("should block requests exceeding the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });

    // First two requests should pass
    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);

    // Reset mock for checking blocked request
    vi.clearAllMocks();

    // Third request should be blocked
    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        retryAfter: expect.any(Number),
      })
    );
  });

  it("should use custom key generator", () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      max: 2,
      keyGenerator: () => "custom-key",
    });

    // Both requests from different IPs should count towards same limit
    mockReq.ip = "192.168.1.1";
    limiter(mockReq as Request, mockRes as Response, mockNext);

    mockReq.ip = "192.168.1.2";
    limiter(mockReq as Request, mockRes as Response, mockNext);

    // Third request should be blocked
    vi.clearAllMocks();
    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it("should use user ID when authenticated", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });

    // Simulate authenticated request
    (mockReq as any).user = { claims: { sub: "user123" } };

    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);

    // Third request should be blocked for this user
    vi.clearAllMocks();
    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
  });
});
