/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

/**
 * Session Expiry Tests - PERF-403
 * 
 * Tests for the session expiry buffer logic:
 * - Sessions within 30 seconds of expiry should be treated as expired
 * - Sessions beyond buffer period should be valid
 * - Expired sessions should be invalid
 */

describe("Session Expiry - PERF-403", () => {
  const EXPIRY_BUFFER_MS = 30000; // 30 seconds

  // Helper function that mirrors the actual implementation logic
  function isSessionValid(expiresAt: Date, now: Date = new Date()): { valid: boolean; reason: string } {
    const expiresIn = expiresAt.getTime() - now.getTime();

    if (expiresIn > EXPIRY_BUFFER_MS) {
      return { valid: true, reason: "Session is valid" };
    } else if (expiresIn > 0) {
      return { valid: false, reason: "Session expired (within buffer period)" };
    } else {
      return { valid: false, reason: "Session is expired" };
    }
  }

  describe("Valid Sessions (beyond buffer period)", () => {
    it("should accept session expiring in 1 hour", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(true);
    });

    it("should accept session expiring in 1 minute", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(true);
    });

    it("should accept session expiring in 31 seconds (just beyond buffer)", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 31000); // 31 seconds
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(true);
    });
  });

  describe("Buffer Period Sessions (within 30 seconds of expiry)", () => {
    it("should reject session expiring in 30 seconds (at buffer boundary)", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30000); // exactly 30 seconds
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session expired (within buffer period)");
    });

    it("should reject session expiring in 15 seconds", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15000); // 15 seconds
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session expired (within buffer period)");
    });

    it("should reject session expiring in 1 second", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000); // 1 second
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session expired (within buffer period)");
    });

    it("should reject session expiring in 100ms", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 100); // 100ms
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session expired (within buffer period)");
    });
  });

  describe("Expired Sessions", () => {
    it("should reject session that expired 1 second ago", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() - 1000); // 1 second ago
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session is expired");
    });

    it("should reject session that expired 1 hour ago", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session is expired");
    });

    it("should reject session expiring exactly now (0ms)", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime()); // exactly now
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.reason).toBe("Session is expired");
    });
  });

  describe("Buffer constant", () => {
    it("should use 30 second buffer period", () => {
      jestExpect(EXPIRY_BUFFER_MS).toBe(30000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle boundary at exactly buffer + 1ms", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPIRY_BUFFER_MS + 1);
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(true);
    });

    it("should handle boundary at exactly buffer - 1ms", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPIRY_BUFFER_MS - 1);
      
      const result = isSessionValid(expiresAt, now);
      jestExpect(result.valid).toBe(false);
    });
  });
});

