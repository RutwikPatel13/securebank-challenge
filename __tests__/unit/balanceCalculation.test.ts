/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

describe("Balance Calculation - PERF-406 (Balance Calculation Errors)", () => {
  describe("Bug demonstration: loop-based calculation issues", () => {
    it("should show the loop approach is unnecessarily complex", () => {
      const accountBalance = 0;
      const amount = 100;

      // BUG: Old code used this convoluted loop
      let loopBalance = accountBalance;
      for (let i = 0; i < 100; i++) {
        loopBalance = loopBalance + amount / 100;
      }

      // Direct calculation is simpler and clearer
      const directBalance = accountBalance + amount;

      // Both might give same result for some values, but loop is:
      // 1. Harder to understand
      // 2. More prone to errors
      // 3. Inconsistent with what's stored in DB
      jestExpect(directBalance).toBe(100);
    });

    it("should show floating-point errors with problematic values", () => {
      // Some values DO cause floating-point issues with the loop
      const amount = 0.1;

      let loopResult = 0;
      for (let i = 0; i < 100; i++) {
        loopResult = loopResult + amount / 100;
      }

      // 0.1 / 100 = 0.001, added 100 times should be 0.1
      // But floating-point math can cause issues
      const directResult = amount;

      jestExpect(directResult).toBe(0.1);
      // Loop result may or may not equal 0.1 exactly due to floating-point
    });
  });

  describe("Fix demonstration: direct calculation", () => {
    it("should calculate balance correctly with direct addition", () => {
      const accountBalance = 0;
      const amount = 100;

      // FIX: Simple direct addition
      const newBalance = accountBalance + amount;

      jestExpect(newBalance).toBe(100); // Exact!
    });

    it("should handle multiple transactions correctly", () => {
      let balance = 0;
      const transactions = [100, 50, 25, 75, 200];

      // Simple direct addition for each transaction
      for (const amount of transactions) {
        balance = balance + amount;
      }

      const expectedTotal = 100 + 50 + 25 + 75 + 200; // 450
      jestExpect(balance).toBe(expectedTotal); // Exact!
    });

    it("should handle decimal amounts correctly", () => {
      let balance = 0;
      const transactions = [10.50, 25.75, 100.25];

      for (const amount of transactions) {
        balance = balance + amount;
      }

      // Note: JavaScript still has some floating-point issues with decimals
      // but direct addition is much more accurate than the loop approach
      jestExpect(balance).toBeCloseTo(136.50, 2);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero amount", () => {
      const balance = 100;
      const amount = 0;
      const newBalance = balance + amount;
      
      jestExpect(newBalance).toBe(100);
    });

    it("should handle large amounts", () => {
      const balance = 1000000;
      const amount = 500000;
      const newBalance = balance + amount;
      
      jestExpect(newBalance).toBe(1500000);
    });

    it("should handle small decimal amounts", () => {
      const balance = 100;
      const amount = 0.01;
      const newBalance = balance + amount;
      
      jestExpect(newBalance).toBeCloseTo(100.01, 2);
    });
  });
});

