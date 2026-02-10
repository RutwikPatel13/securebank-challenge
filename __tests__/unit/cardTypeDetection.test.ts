/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

// Card type detection function (same as in FundingModal.tsx)
type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/[\s-]/g, "");

  if (!digits || digits.length < 1) return "unknown";

  // Visa: Starts with 4
  if (digits.startsWith("4")) {
    return "visa";
  }

  // American Express: Starts with 34 or 37
  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "amex";
  }

  // Mastercard: 51-55 or 2221-2720
  const first2 = parseInt(digits.substring(0, 2), 10);
  const first4 = parseInt(digits.substring(0, 4), 10);

  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) {
    return "mastercard";
  }

  // Discover: 6011, 622126-622925, 644-649, 65
  if (digits.startsWith("6011") || digits.startsWith("65")) {
    return "discover";
  }
  const first6 = parseInt(digits.substring(0, 6), 10);
  if (first6 >= 622126 && first6 <= 622925) {
    return "discover";
  }
  const first3 = parseInt(digits.substring(0, 3), 10);
  if (first3 >= 644 && first3 <= 649) {
    return "discover";
  }

  return "unknown";
}

describe("Card Type Detection - VAL-210", () => {
  describe("Visa Detection", () => {
    it("should detect Visa cards (starts with 4)", () => {
      jestExpect(detectCardType("4111111111111111")).toBe("visa");
      jestExpect(detectCardType("4242424242424242")).toBe("visa");
      jestExpect(detectCardType("4000000000000000")).toBe("visa");
    });
  });

  describe("Mastercard Detection", () => {
    it("should detect Mastercard cards (51-55 range)", () => {
      jestExpect(detectCardType("5111111111111111")).toBe("mastercard");
      jestExpect(detectCardType("5200000000000000")).toBe("mastercard");
      jestExpect(detectCardType("5300000000000000")).toBe("mastercard");
      jestExpect(detectCardType("5400000000000000")).toBe("mastercard");
      jestExpect(detectCardType("5500000000000000")).toBe("mastercard");
    });

    it("should detect Mastercard cards (2221-2720 range)", () => {
      jestExpect(detectCardType("2221000000000000")).toBe("mastercard");
      jestExpect(detectCardType("2223000048400011")).toBe("mastercard");
      jestExpect(detectCardType("2500000000000000")).toBe("mastercard");
      jestExpect(detectCardType("2720000000000000")).toBe("mastercard");
    });

    it("should NOT detect cards outside Mastercard ranges", () => {
      jestExpect(detectCardType("5000000000000000")).not.toBe("mastercard"); // 50 is not in range
      jestExpect(detectCardType("5600000000000000")).not.toBe("mastercard"); // 56 is not in range
      jestExpect(detectCardType("2220000000000000")).not.toBe("mastercard"); // 2220 is not in range
      jestExpect(detectCardType("2721000000000000")).not.toBe("mastercard"); // 2721 is not in range
    });
  });

  describe("American Express Detection", () => {
    it("should detect Amex cards (34 or 37)", () => {
      jestExpect(detectCardType("340000000000000")).toBe("amex");
      jestExpect(detectCardType("370000000000000")).toBe("amex");
      jestExpect(detectCardType("378282246310005")).toBe("amex");
    });
  });

  describe("Discover Detection", () => {
    it("should detect Discover cards (6011 prefix)", () => {
      jestExpect(detectCardType("6011000000000000")).toBe("discover");
      jestExpect(detectCardType("6011111111111117")).toBe("discover");
    });

    it("should detect Discover cards (65 prefix)", () => {
      jestExpect(detectCardType("6500000000000000")).toBe("discover");
      jestExpect(detectCardType("6500000000000002")).toBe("discover");
    });

    it("should detect Discover cards (644-649 range)", () => {
      jestExpect(detectCardType("6440000000000000")).toBe("discover");
      jestExpect(detectCardType("6450000000000000")).toBe("discover");
      jestExpect(detectCardType("6490000000000000")).toBe("discover");
    });

    it("should detect Discover cards (622126-622925 range - China UnionPay co-branded)", () => {
      jestExpect(detectCardType("6221260000000000")).toBe("discover");
      jestExpect(detectCardType("6225000000000000")).toBe("discover");
      jestExpect(detectCardType("6229250000000000")).toBe("discover");
    });

    it("should NOT detect cards outside Discover ranges", () => {
      jestExpect(detectCardType("6221250000000000")).not.toBe("discover"); // 622125 is not in range
      jestExpect(detectCardType("6229260000000000")).not.toBe("discover"); // 622926 is not in range
      jestExpect(detectCardType("6430000000000000")).not.toBe("discover"); // 643 is not in range
    });
  });

  describe("Unknown Card Type", () => {
    it("should return unknown for unrecognized prefixes", () => {
      jestExpect(detectCardType("1234567890123456")).toBe("unknown");
      jestExpect(detectCardType("9999999999999999")).toBe("unknown");
      jestExpect(detectCardType("")).toBe("unknown");
    });
  });

  describe("Edge Cases", () => {
    it("should handle cards with spaces and dashes", () => {
      jestExpect(detectCardType("4111 1111 1111 1111")).toBe("visa");
      jestExpect(detectCardType("4111-1111-1111-1111")).toBe("visa");
    });
  });
});

