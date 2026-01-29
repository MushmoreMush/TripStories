import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  reportFiltersSchema,
  friendRequestSchema,
  friendResponseSchema,
  channelMessageSchema,
  reactionSchema,
  reportUpdateSchema,
} from "../server/middleware/validation";

describe("Validation Schemas", () => {
  describe("paginationSchema", () => {
    it("should set default values", () => {
      const result = paginationSchema.parse({});
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("should coerce string values to numbers", () => {
      const result = paginationSchema.parse({ limit: "50", offset: "10" });
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });

    it("should enforce max limit of 100", () => {
      const result = paginationSchema.parse({ limit: 200 });
      expect(result.limit).toBe(100);
    });

    it("should reject negative offset", () => {
      expect(() => paginationSchema.parse({ offset: -1 })).toThrow();
    });
  });

  describe("friendRequestSchema", () => {
    it("should require addresseeId", () => {
      expect(() => friendRequestSchema.parse({})).toThrow();
    });

    it("should accept valid addresseeId", () => {
      const result = friendRequestSchema.parse({ addresseeId: "user123" });
      expect(result.addresseeId).toBe("user123");
    });

    it("should reject empty addresseeId", () => {
      expect(() => friendRequestSchema.parse({ addresseeId: "" })).toThrow();
    });
  });

  describe("friendResponseSchema", () => {
    it("should accept 'accepted' status", () => {
      const result = friendResponseSchema.parse({ status: "accepted" });
      expect(result.status).toBe("accepted");
    });

    it("should accept 'rejected' status", () => {
      const result = friendResponseSchema.parse({ status: "rejected" });
      expect(result.status).toBe("rejected");
    });

    it("should reject invalid status", () => {
      expect(() => friendResponseSchema.parse({ status: "invalid" })).toThrow();
    });
  });

  describe("channelMessageSchema", () => {
    it("should require non-empty content", () => {
      expect(() => channelMessageSchema.parse({ content: "" })).toThrow();
    });

    it("should accept valid message", () => {
      const result = channelMessageSchema.parse({ content: "Hello world" });
      expect(result.content).toBe("Hello world");
    });

    it("should reject messages over 2000 characters", () => {
      const longMessage = "a".repeat(2001);
      expect(() => channelMessageSchema.parse({ content: longMessage })).toThrow();
    });
  });

  describe("reactionSchema", () => {
    it("should accept valid reaction types", () => {
      const validTypes = ["care", "solidarity", "strength", "insight", "gratitude"];
      validTypes.forEach((type) => {
        const result = reactionSchema.parse({ type });
        expect(result.type).toBe(type);
      });
    });

    it("should reject invalid reaction type", () => {
      expect(() => reactionSchema.parse({ type: "like" })).toThrow();
    });
  });

  describe("reportUpdateSchema", () => {
    it("should accept valid status values", () => {
      const validStatuses = ["draft", "private", "shared"];
      validStatuses.forEach((status) => {
        const result = reportUpdateSchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it("should reject invalid status", () => {
      expect(() => reportUpdateSchema.parse({ status: "public" })).toThrow();
    });

    it("should accept optional fields", () => {
      const result = reportUpdateSchema.parse({
        substance: "Psilocybin",
        amount: "2g",
        tags: ["meditation", "nature"],
      });
      expect(result.substance).toBe("Psilocybin");
      expect(result.amount).toBe("2g");
      expect(result.tags).toEqual(["meditation", "nature"]);
    });
  });
});
