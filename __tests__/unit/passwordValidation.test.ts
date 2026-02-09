/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

// Password validation rules (same as in auth.ts and signup page)
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character" };
  }
  return { valid: true };
}

describe("Password Validation - VAL-208 (Strong Password Requirements)", () => {
  describe("Valid passwords", () => {
    it("should accept password with all requirements met", () => {
      const validPasswords = [
        "Password1!",
        "SecurePass123@",
        "MyP@ssw0rd",
        "Complex#Pass9",
        "Str0ng!Pass",
      ];
      validPasswords.forEach((password) => {
        jestExpect(isValidPassword(password).valid).toBe(true);
      });
    });

    it("should accept password with various special characters", () => {
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+"];
      specialChars.forEach((char) => {
        const password = `Password1${char}`;
        jestExpect(isValidPassword(password).valid).toBe(true);
      });
    });
  });

  describe("Invalid passwords - missing requirements", () => {
    it("should reject password without uppercase letter", () => {
      const result = isValidPassword("password1!");
      jestExpect(result.valid).toBe(false);
      jestExpect(result.error).toContain("uppercase");
    });

    it("should reject password without lowercase letter", () => {
      const result = isValidPassword("PASSWORD1!");
      jestExpect(result.valid).toBe(false);
      jestExpect(result.error).toContain("lowercase");
    });

    it("should reject password without number", () => {
      const result = isValidPassword("Password!");
      jestExpect(result.valid).toBe(false);
      jestExpect(result.error).toContain("number");
    });

    it("should reject password without special character", () => {
      const result = isValidPassword("Password1");
      jestExpect(result.valid).toBe(false);
      jestExpect(result.error).toContain("special character");
    });

    it("should reject password that is too short", () => {
      const result = isValidPassword("Pa1!");
      jestExpect(result.valid).toBe(false);
      jestExpect(result.error).toContain("8 characters");
    });
  });

  describe("Edge cases", () => {
    it("should reject empty password", () => {
      const result = isValidPassword("");
      jestExpect(result.valid).toBe(false);
    });

    it("should reject password with only spaces", () => {
      const result = isValidPassword("        ");
      jestExpect(result.valid).toBe(false);
    });

    it("should accept password that is exactly 8 characters with all requirements", () => {
      const result = isValidPassword("Aa1!xxxx");
      jestExpect(result.valid).toBe(true);
    });

    it("should accept long password with all requirements", () => {
      const result = isValidPassword("ThisIsAVeryLongPassword123!@#$%");
      jestExpect(result.valid).toBe(true);
    });
  });

  describe("Common weak passwords", () => {
    it("should reject common passwords that lack requirements", () => {
      const weakPasswords = [
        "password", // no uppercase, number, special
        "12345678", // no letters, special
        "qwerty123", // no uppercase, special
        "letmein!", // no uppercase, number
      ];
      weakPasswords.forEach((password) => {
        jestExpect(isValidPassword(password).valid).toBe(false);
      });
    });
  });
});

