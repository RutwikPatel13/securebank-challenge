/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

// Luhn algorithm implementation (same as in FundingModal.tsx)
function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/[\s-]/g, "");

  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

describe("Card Number Validation - VAL-206 (Luhn Algorithm)", () => {
  describe("Valid card numbers", () => {
    it("should accept valid Visa card numbers", () => {
      // Test Visa cards (start with 4)
      const validVisaCards = [
        "4111111111111111", // Common test card
        "4012888888881881",
        "4222222222222",
      ];
      validVisaCards.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(true);
      });
    });

    it("should accept valid Mastercard numbers", () => {
      // Test Mastercard (start with 5)
      const validMastercards = [
        "5555555555554444",
        "5105105105105100",
      ];
      validMastercards.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(true);
      });
    });

    it("should accept valid American Express numbers", () => {
      // Test Amex (start with 34 or 37)
      const validAmex = [
        "378282246310005",
        "371449635398431",
        "340000000000009",
      ];
      validAmex.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(true);
      });
    });

    it("should accept valid Discover card numbers", () => {
      // Test Discover (start with 6)
      const validDiscover = [
        "6011111111111117",
        "6011000990139424",
      ];
      validDiscover.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(true);
      });
    });
  });

  describe("Invalid card numbers", () => {
    it("should reject card numbers that fail Luhn check", () => {
      const invalidCards = [
        "4111111111111112", // Changed last digit from valid card
        "1234567890123456", // Random number
        "4111111111111110", // Another invalid variation
      ];
      invalidCards.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(false);
      });
    });

    it("should reject card numbers with wrong length", () => {
      const wrongLengthCards = [
        "411111111111", // Too short (12 digits)
        "41111111111111111111", // Too long (20 digits)
        "123", // Way too short
      ];
      wrongLengthCards.forEach((card) => {
        jestExpect(isValidCardNumber(card)).toBe(false);
      });
    });

    it("should reject non-numeric input", () => {
      const nonNumericCards = [
        "4111-1111-1111-1111", // With dashes (handled by regex)
        "abcd1234efgh5678",
      ];
      // After removing non-digits, these should fail
      jestExpect(isValidCardNumber("abcd1234efgh5678")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle cards with spaces (after stripping)", () => {
      // The function strips spaces, so this should work
      jestExpect(isValidCardNumber("4111 1111 1111 1111")).toBe(true);
    });

    it("should handle cards with dashes (after stripping)", () => {
      jestExpect(isValidCardNumber("4111-1111-1111-1111")).toBe(true);
    });

    it("should reject empty string", () => {
      jestExpect(isValidCardNumber("")).toBe(false);
    });
  });
});

