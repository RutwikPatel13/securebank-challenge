/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";
import {
  US_STATE_CODES,
  EMAIL_TYPO_DOMAINS,
  checkEmailTypo,
  isValidPhoneNumber,
  isValidStateCode,
} from "@/lib/validation";

describe("Registration Validation - VAL-201, VAL-203, VAL-204", () => {
  describe("VAL-201: Email Typo Detection", () => {
    it("should detect common Gmail typos", () => {
      jestExpect(checkEmailTypo("test@gmial.com")).toBe("Did you mean test@gmail.com?");
      jestExpect(checkEmailTypo("test@gmal.com")).toBe("Did you mean test@gmail.com?");
      jestExpect(checkEmailTypo("test@gamil.com")).toBe("Did you mean test@gmail.com?");
      jestExpect(checkEmailTypo("test@gmail.con")).toBe("Did you mean test@gmail.com?");
      jestExpect(checkEmailTypo("test@gmail.co")).toBe("Did you mean test@gmail.com?");
    });

    it("should detect common Hotmail typos", () => {
      jestExpect(checkEmailTypo("test@hotmal.com")).toBe("Did you mean test@hotmail.com?");
      jestExpect(checkEmailTypo("test@hotmail.con")).toBe("Did you mean test@hotmail.com?");
    });

    it("should detect common Yahoo typos", () => {
      jestExpect(checkEmailTypo("test@yahooo.com")).toBe("Did you mean test@yahoo.com?");
      jestExpect(checkEmailTypo("test@yahoo.con")).toBe("Did you mean test@yahoo.com?");
    });

    it("should detect common Outlook typos", () => {
      jestExpect(checkEmailTypo("test@outloo.com")).toBe("Did you mean test@outlook.com?");
      jestExpect(checkEmailTypo("test@outlook.con")).toBe("Did you mean test@outlook.com?");
    });

    it("should return true for valid email domains", () => {
      jestExpect(checkEmailTypo("test@gmail.com")).toBe(true);
      jestExpect(checkEmailTypo("test@hotmail.com")).toBe(true);
      jestExpect(checkEmailTypo("test@yahoo.com")).toBe(true);
      jestExpect(checkEmailTypo("test@outlook.com")).toBe(true);
      jestExpect(checkEmailTypo("test@company.com")).toBe(true);
    });

    it("should be case insensitive", () => {
      jestExpect(checkEmailTypo("TEST@GMIAL.COM")).toBe("Did you mean test@gmail.com?");
    });

    it("should have all expected typo domains in the map", () => {
      const expectedTypos = [
        "gmial.com", "gmal.com", "gamil.com", "gmail.con", "gmail.co",
        "hotmal.com", "hotmail.con", "yahooo.com", "yahoo.con",
        "outloo.com", "outlook.con"
      ];
      expectedTypos.forEach(typo => {
        jestExpect(EMAIL_TYPO_DOMAINS[typo]).toBeDefined();
      });
    });
  });

  describe("VAL-203: State Code Validation", () => {
    it("should accept valid US state codes", () => {
      jestExpect(isValidStateCode("CA")).toBe(true);
      jestExpect(isValidStateCode("NY")).toBe(true);
      jestExpect(isValidStateCode("TX")).toBe(true);
      jestExpect(isValidStateCode("FL")).toBe(true);
    });

    it("should accept DC and territories", () => {
      jestExpect(isValidStateCode("DC")).toBe(true);
      jestExpect(isValidStateCode("PR")).toBe(true); // Puerto Rico
      jestExpect(isValidStateCode("VI")).toBe(true); // Virgin Islands
      jestExpect(isValidStateCode("GU")).toBe(true); // Guam
    });

    it("should reject invalid state codes", () => {
      jestExpect(isValidStateCode("XX")).toBe(false);
      jestExpect(isValidStateCode("ZZ")).toBe(false);
      jestExpect(isValidStateCode("AB")).toBe(false); // Canadian province
      jestExpect(isValidStateCode("QC")).toBe(false); // Canadian province
    });

    it("should be case insensitive", () => {
      jestExpect(isValidStateCode("ca")).toBe(true);
      jestExpect(isValidStateCode("Ca")).toBe(true);
      jestExpect(isValidStateCode("cA")).toBe(true);
    });

    it("should have all 50 states plus DC and territories", () => {
      jestExpect(US_STATE_CODES.length).toBe(56); // 50 states + DC + 5 territories
    });
  });

  describe("VAL-204: Phone Number Validation", () => {
    it("should accept valid US phone numbers (10 digits)", () => {
      jestExpect(isValidPhoneNumber("1234567890")).toBe(true);
      jestExpect(isValidPhoneNumber("123-456-7890")).toBe(true);
      jestExpect(isValidPhoneNumber("(123) 456-7890")).toBe(true);
      jestExpect(isValidPhoneNumber("123.456.7890")).toBe(true);
    });

    it("should accept US phone numbers with +1 prefix", () => {
      jestExpect(isValidPhoneNumber("+11234567890")).toBe(true);
      jestExpect(isValidPhoneNumber("+1 123 456 7890")).toBe(true);
      jestExpect(isValidPhoneNumber("11234567890")).toBe(true);
    });

    it("should accept international phone numbers", () => {
      jestExpect(isValidPhoneNumber("+442071234567")).toBe(true); // UK
      jestExpect(isValidPhoneNumber("+44 20 7123 4567")).toBe(true); // UK with spaces
      jestExpect(isValidPhoneNumber("+33123456789")).toBe(true); // France
      jestExpect(isValidPhoneNumber("+81312345678")).toBe(true); // Japan
    });

    it("should reject invalid phone numbers", () => {
      jestExpect(isValidPhoneNumber("123456789")).toBe(false); // Too short (9 digits)
      jestExpect(isValidPhoneNumber("12345678901234567890")).toBe(false); // Too long
      jestExpect(isValidPhoneNumber("abcdefghij")).toBe(false); // Letters
      jestExpect(isValidPhoneNumber("")).toBe(false); // Empty
    });
  });
});

