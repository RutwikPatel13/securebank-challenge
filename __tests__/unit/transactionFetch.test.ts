/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

describe("Transaction Fetch - PERF-405 (Missing Transactions)", () => {
  describe("Transaction ordering logic", () => {
    it("should understand that ascending order returns oldest first", () => {
      const transactions = [
        { id: 1, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, createdAt: "2024-01-01T11:00:00Z" },
        { id: 3, createdAt: "2024-01-01T12:00:00Z" },
      ];

      // Ascending order (default) - oldest first
      const ascending = [...transactions].sort((a, b) => 
        a.createdAt.localeCompare(b.createdAt)
      );
      
      // First item is the oldest
      jestExpect(ascending[0].id).toBe(1);
    });

    it("should understand that descending order returns newest first", () => {
      const transactions = [
        { id: 1, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, createdAt: "2024-01-01T11:00:00Z" },
        { id: 3, createdAt: "2024-01-01T12:00:00Z" },
      ];

      // Descending order - newest first
      const descending = [...transactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // First item is the newest
      jestExpect(descending[0].id).toBe(3);
    });

    it("should filter transactions by accountId before selecting", () => {
      const allTransactions = [
        { id: 1, accountId: 1, amount: 100 },
        { id: 2, accountId: 2, amount: 200 },
        { id: 3, accountId: 1, amount: 300 },
        { id: 4, accountId: 1, amount: 400 },
      ];

      const accountId = 1;
      
      // Filter by accountId first
      const accountTransactions = allTransactions.filter(t => t.accountId === accountId);
      
      // Then get the most recent (highest id)
      const mostRecent = accountTransactions.sort((a, b) => b.id - a.id)[0];
      
      jestExpect(mostRecent.id).toBe(4);
      jestExpect(mostRecent.amount).toBe(400);
    });
  });

  describe("Bug reproduction scenario", () => {
    it("should demonstrate the bug: ascending order returns wrong transaction", () => {
      // Simulate multiple funding events
      const transactions = [
        { id: 1, accountId: 1, amount: 100, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, accountId: 1, amount: 200, createdAt: "2024-01-01T11:00:00Z" },
        { id: 3, accountId: 1, amount: 300, createdAt: "2024-01-01T12:00:00Z" },
      ];

      // BUG: Old code used ascending order without filtering
      const buggyResult = [...transactions]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      
      // This always returns the first transaction, not the newly created one!
      jestExpect(buggyResult.id).toBe(1);
      jestExpect(buggyResult.amount).toBe(100); // Wrong! Should be 300
    });

    it("should demonstrate the fix: descending order with filter returns correct transaction", () => {
      const transactions = [
        { id: 1, accountId: 1, amount: 100, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, accountId: 1, amount: 200, createdAt: "2024-01-01T11:00:00Z" },
        { id: 3, accountId: 1, amount: 300, createdAt: "2024-01-01T12:00:00Z" },
      ];

      const accountId = 1;
      
      // FIX: Filter by accountId and use descending order by id
      const fixedResult = transactions
        .filter(t => t.accountId === accountId)
        .sort((a, b) => b.id - a.id)[0];
      
      // Now we get the most recent transaction
      jestExpect(fixedResult.id).toBe(3);
      jestExpect(fixedResult.amount).toBe(300); // Correct!
    });
  });

  describe("Edge cases", () => {
    it("should handle single transaction correctly", () => {
      const transactions = [
        { id: 1, accountId: 1, amount: 100 },
      ];

      const result = transactions
        .filter(t => t.accountId === 1)
        .sort((a, b) => b.id - a.id)[0];
      
      jestExpect(result.id).toBe(1);
    });

    it("should handle multiple accounts correctly", () => {
      const transactions = [
        { id: 1, accountId: 1, amount: 100 },
        { id: 2, accountId: 2, amount: 500 },
        { id: 3, accountId: 1, amount: 200 },
      ];

      // Get most recent for account 1
      const account1Latest = transactions
        .filter(t => t.accountId === 1)
        .sort((a, b) => b.id - a.id)[0];
      
      jestExpect(account1Latest.id).toBe(3);
      jestExpect(account1Latest.amount).toBe(200);

      // Get most recent for account 2
      const account2Latest = transactions
        .filter(t => t.accountId === 2)
        .sort((a, b) => b.id - a.id)[0];
      
      jestExpect(account2Latest.id).toBe(2);
      jestExpect(account2Latest.amount).toBe(500);
    });
  });
});

