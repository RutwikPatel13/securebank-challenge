/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

describe("Funding Validation - VAL-205, VAL-207, VAL-209", () => {
  describe("VAL-205: Zero Amount Validation", () => {
    // Validation function that checks minimum amount
    function isValidAmount(amount: string): boolean {
      const parsed = parseFloat(amount);
      return !isNaN(parsed) && parsed >= 0.01;
    }

    it("should reject $0.00 funding amount", () => {
      jestExpect(isValidAmount("0")).toBe(false);
      jestExpect(isValidAmount("0.00")).toBe(false);
      jestExpect(isValidAmount("0.0")).toBe(false);
    });

    it("should accept minimum valid amount ($0.01)", () => {
      jestExpect(isValidAmount("0.01")).toBe(true);
    });

    it("should accept valid positive amounts", () => {
      jestExpect(isValidAmount("1")).toBe(true);
      jestExpect(isValidAmount("100")).toBe(true);
      jestExpect(isValidAmount("100.50")).toBe(true);
      jestExpect(isValidAmount("1000.99")).toBe(true);
    });

    it("should reject negative amounts", () => {
      jestExpect(isValidAmount("-1")).toBe(false);
      jestExpect(isValidAmount("-100")).toBe(false);
    });
  });

  describe("VAL-207: Routing Number Required for Bank Transfers", () => {
    // Validation function that checks routing number requirement
    function isValidFundingSource(type: "card" | "bank", routingNumber?: string): boolean {
      if (type === "bank") {
        return !!routingNumber && /^\d{9}$/.test(routingNumber);
      }
      return true; // Card doesn't need routing number
    }

    it("should require routing number for bank transfers", () => {
      jestExpect(isValidFundingSource("bank", undefined)).toBe(false);
      jestExpect(isValidFundingSource("bank", "")).toBe(false);
    });

    it("should accept valid 9-digit routing number for bank transfers", () => {
      jestExpect(isValidFundingSource("bank", "123456789")).toBe(true);
      jestExpect(isValidFundingSource("bank", "021000021")).toBe(true); // Chase
    });

    it("should reject invalid routing numbers", () => {
      jestExpect(isValidFundingSource("bank", "12345678")).toBe(false); // 8 digits
      jestExpect(isValidFundingSource("bank", "1234567890")).toBe(false); // 10 digits
      jestExpect(isValidFundingSource("bank", "12345678a")).toBe(false); // Contains letter
    });

    it("should not require routing number for card payments", () => {
      jestExpect(isValidFundingSource("card", undefined)).toBe(true);
      jestExpect(isValidFundingSource("card", "")).toBe(true);
    });
  });

  describe("VAL-209: Leading Zeros in Amount", () => {
    // Regex that rejects leading zeros (except for "0" or "0.xx")
    const VALID_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

    function isValidAmountFormat(amount: string): boolean {
      return VALID_AMOUNT_PATTERN.test(amount);
    }

    it("should reject amounts with leading zeros", () => {
      jestExpect(isValidAmountFormat("00100")).toBe(false);
      jestExpect(isValidAmountFormat("01")).toBe(false);
      jestExpect(isValidAmountFormat("007")).toBe(false);
      jestExpect(isValidAmountFormat("00.50")).toBe(false);
    });

    it("should accept valid amount formats", () => {
      jestExpect(isValidAmountFormat("0")).toBe(true);
      jestExpect(isValidAmountFormat("0.50")).toBe(true);
      jestExpect(isValidAmountFormat("0.01")).toBe(true);
      jestExpect(isValidAmountFormat("1")).toBe(true);
      jestExpect(isValidAmountFormat("100")).toBe(true);
      jestExpect(isValidAmountFormat("100.50")).toBe(true);
      jestExpect(isValidAmountFormat("1000.99")).toBe(true);
    });

    it("should accept up to 2 decimal places", () => {
      jestExpect(isValidAmountFormat("100.1")).toBe(true);
      jestExpect(isValidAmountFormat("100.12")).toBe(true);
    });

    it("should reject more than 2 decimal places", () => {
      jestExpect(isValidAmountFormat("100.123")).toBe(false);
      jestExpect(isValidAmountFormat("100.1234")).toBe(false);
    });
  });
});

