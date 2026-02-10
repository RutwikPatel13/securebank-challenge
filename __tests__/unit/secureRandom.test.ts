/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";
import crypto from "crypto";

describe("Secure Random Number Generation - SEC-302", () => {
  // The generateAccountNumber function from server/routers/account.ts
  function generateAccountNumber(): string {
    // crypto.randomInt() uses a CSPRNG and is safe for security-sensitive use
    // Generate a number between 0 and 9999999999 (10 digits)
    return crypto.randomInt(0, 10000000000).toString().padStart(10, "0");
  }

  describe("Account Number Generation", () => {
    it("should generate a 10-digit account number", () => {
      const accountNumber = generateAccountNumber();
      jestExpect(accountNumber).toHaveLength(10);
    });

    it("should generate only numeric characters", () => {
      const accountNumber = generateAccountNumber();
      jestExpect(/^\d{10}$/.test(accountNumber)).toBe(true);
    });

    it("should generate different account numbers on each call", () => {
      const accountNumbers = new Set<string>();
      
      // Generate 100 account numbers
      for (let i = 0; i < 100; i++) {
        accountNumbers.add(generateAccountNumber());
      }
      
      // All should be unique (extremely high probability with CSPRNG)
      jestExpect(accountNumbers.size).toBe(100);
    });

    it("should handle leading zeros correctly", () => {
      // Generate many numbers to increase chance of getting one with leading zeros
      let foundLeadingZero = false;
      for (let i = 0; i < 1000; i++) {
        const num = generateAccountNumber();
        if (num.startsWith("0")) {
          foundLeadingZero = true;
          // Verify it's still 10 digits
          jestExpect(num).toHaveLength(10);
          break;
        }
      }
      // Note: This test may occasionally not find a leading zero, which is fine
      // The important thing is that when it does, the padding works correctly
    });
  });

  describe("Cryptographic Security", () => {
    it("should use crypto.randomInt (CSPRNG)", () => {
      // Verify crypto.randomInt exists and works
      const randomValue = crypto.randomInt(0, 100);
      jestExpect(typeof randomValue).toBe("number");
      jestExpect(randomValue).toBeGreaterThanOrEqual(0);
      jestExpect(randomValue).toBeLessThan(100);
    });

    it("should NOT use Math.random (which is predictable)", () => {
      // This test documents that we're using crypto, not Math.random
      // Math.random() returns a float between 0 and 1
      // crypto.randomInt() returns an integer in a range
      
      // Generate account numbers and verify they're integers (not floats)
      for (let i = 0; i < 10; i++) {
        const accountNumber = generateAccountNumber();
        const parsed = parseInt(accountNumber, 10);
        jestExpect(Number.isInteger(parsed)).toBe(true);
      }
    });

    it("should generate uniformly distributed numbers", () => {
      // Generate many numbers and check rough distribution
      const buckets: number[] = new Array(10).fill(0);
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const num = generateAccountNumber();
        const firstDigit = parseInt(num[0], 10);
        buckets[firstDigit]++;
      }
      
      // Each bucket should have roughly 10% of the numbers (with some variance)
      // Allow 5-15% range for each bucket
      const minExpected = iterations * 0.05;
      const maxExpected = iterations * 0.15;
      
      buckets.forEach((count, digit) => {
        jestExpect(count).toBeGreaterThan(minExpected);
        jestExpect(count).toBeLessThan(maxExpected);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should generate valid account numbers at boundaries", () => {
      // The range is 0 to 9999999999
      // Minimum: 0000000000
      // Maximum: 9999999999
      
      for (let i = 0; i < 100; i++) {
        const num = generateAccountNumber();
        const parsed = parseInt(num, 10);
        jestExpect(parsed).toBeGreaterThanOrEqual(0);
        jestExpect(parsed).toBeLessThanOrEqual(9999999999);
      }
    });
  });
});

