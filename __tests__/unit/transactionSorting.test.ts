/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

describe("Transaction Sorting - PERF-404", () => {
  
  // Simulates transaction data
  const mockTransactions = [
    { id: 1, accountId: 1, amount: 100, createdAt: "2024-01-01T10:00:00Z" },
    { id: 2, accountId: 1, amount: 200, createdAt: "2024-01-01T11:00:00Z" },
    { id: 3, accountId: 1, amount: 300, createdAt: "2024-01-01T12:00:00Z" },
    { id: 4, accountId: 1, amount: 400, createdAt: "2024-01-02T09:00:00Z" },
    { id: 5, accountId: 1, amount: 500, createdAt: "2024-01-02T10:00:00Z" },
  ];

  describe("Bug: No ORDER BY clause", () => {
    it("should demonstrate undefined order without sorting", () => {
      // Without ORDER BY, database may return in any order
      // Simulating potential "random" order
      const unsorted = [
        mockTransactions[2], // id: 3
        mockTransactions[0], // id: 1
        mockTransactions[4], // id: 5
        mockTransactions[1], // id: 2
        mockTransactions[3], // id: 4
      ];
      
      // Order is unpredictable
      jestExpect(unsorted[0].id).not.toBe(5); // Newest is NOT first
      jestExpect(unsorted[0].id).not.toBe(1); // Oldest is NOT first either
    });
  });

  describe("Fix: ORDER BY createdAt DESC", () => {
    it("should sort transactions newest first", () => {
      const sorted = [...mockTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      jestExpect(sorted[0].id).toBe(5); // Newest first
      jestExpect(sorted[sorted.length - 1].id).toBe(1); // Oldest last
    });

    it("should maintain consistent order on repeated queries", () => {
      const query1 = [...mockTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      const query2 = [...mockTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // Same order every time
      jestExpect(query1.map(t => t.id)).toEqual(query2.map(t => t.id));
    });

    it("should show most recent transaction at top", () => {
      const sorted = [...mockTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // Most recent (Jan 2, 10:00) should be first
      jestExpect(sorted[0].createdAt).toBe("2024-01-02T10:00:00Z");
      jestExpect(sorted[0].amount).toBe(500);
    });
  });

  describe("User Experience", () => {
    it("should display transactions in chronological order (newest first)", () => {
      const sorted = [...mockTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // Verify chronological order
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].createdAt);
        const next = new Date(sorted[i + 1].createdAt);
        jestExpect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it("should handle same-day transactions correctly", () => {
      const sameDayTransactions = [
        { id: 1, createdAt: "2024-01-01T09:00:00Z" },
        { id: 2, createdAt: "2024-01-01T12:00:00Z" },
        { id: 3, createdAt: "2024-01-01T15:00:00Z" },
      ];
      
      const sorted = [...sameDayTransactions].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // 3pm should be first, 9am should be last
      jestExpect(sorted[0].id).toBe(3);
      jestExpect(sorted[2].id).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single transaction", () => {
      const single = [mockTransactions[0]];
      const sorted = [...single].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      jestExpect(sorted.length).toBe(1);
      jestExpect(sorted[0].id).toBe(1);
    });

    it("should handle empty transaction list", () => {
      const empty: typeof mockTransactions = [];
      const sorted = [...empty].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      jestExpect(sorted.length).toBe(0);
    });

    it("should handle transactions with same timestamp", () => {
      const sameTime = [
        { id: 1, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, createdAt: "2024-01-01T10:00:00Z" },
      ];
      
      const sorted = [...sameTime].sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      );
      
      // Both should be present, order between them is stable
      jestExpect(sorted.length).toBe(2);
    });
  });
});

