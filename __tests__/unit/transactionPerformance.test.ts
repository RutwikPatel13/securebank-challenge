/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Transaction Performance - PERF-407", () => {
  let accountRouterCode: string;

  beforeAll(() => {
    const routerPath = path.join(process.cwd(), "server/routers/account.ts");
    accountRouterCode = fs.readFileSync(routerPath, "utf-8");
  });

  describe("N+1 query fix", () => {
    it("should NOT have a for loop with database query inside getTransactions", () => {
      // Extract getTransactions function
      const getTransactionsMatch = accountRouterCode.match(
        /getTransactions:[\s\S]*?\.query\(async[\s\S]*?\}\),/
      );
      jestExpect(getTransactionsMatch).not.toBeNull();

      const getTransactionsCode = getTransactionsMatch![0];

      // Should NOT have a for loop with db query inside
      const hasForLoopWithQuery =
        /for\s*\([^)]*\)\s*\{[\s\S]*?await\s+db\./.test(getTransactionsCode);
      jestExpect(hasForLoopWithQuery).toBe(false);
    });

    it("should use map instead of for loop for enrichment", () => {
      // Should use .map() for transforming transactions
      jestExpect(accountRouterCode).toMatch(/accountTransactions\.map\(/);
    });

    it("should reuse the account variable for accountType", () => {
      // Should reference account.accountType, not accountDetails
      jestExpect(accountRouterCode).toMatch(/account\.accountType/);
    });

    it("should NOT query accounts inside the transaction loop", () => {
      // Should not have accountDetails query pattern
      const hasAccountDetailsQuery = /accountDetails\s*=\s*await\s+db/.test(
        accountRouterCode
      );
      jestExpect(hasAccountDetailsQuery).toBe(false);
    });
  });

  describe("Query efficiency", () => {
    it("should have only 2 main queries in getTransactions", () => {
      // Extract getTransactions function
      const getTransactionsMatch = accountRouterCode.match(
        /getTransactions:[\s\S]*?\.query\(async[\s\S]*?\}\),/
      );
      jestExpect(getTransactionsMatch).not.toBeNull();

      const getTransactionsCode = getTransactionsMatch![0];

      // Count db.select() calls - should be exactly 2
      // 1. Verify account belongs to user
      // 2. Get transactions
      const selectCalls = (getTransactionsCode.match(/db\s*\.\s*select\(/g) || []).length;
      jestExpect(selectCalls).toBe(2);
    });

    it("should fetch account before transactions", () => {
      // Account query should come before transactions query
      const accountQueryIndex = accountRouterCode.indexOf("eq(accounts.id, input.accountId)");
      const transactionsQueryIndex = accountRouterCode.indexOf("eq(transactions.accountId, input.accountId)");

      jestExpect(accountQueryIndex).toBeLessThan(transactionsQueryIndex);
    });
  });

  describe("Code quality", () => {
    it("should have a comment explaining the N+1 fix", () => {
      // Should have a comment about N+1 or reusing account
      const hasExplanatoryComment =
        /N\+1|no need to query|already fetched/i.test(accountRouterCode);
      jestExpect(hasExplanatoryComment).toBe(true);
    });

    it("should still include accountType in the response", () => {
      // The response should still have accountType
      jestExpect(accountRouterCode).toMatch(/accountType:\s*account\.accountType/);
    });
  });
});

