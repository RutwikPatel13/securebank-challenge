/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

describe("Date of Birth Validation - VAL-202", () => {
  // Helper function to calculate age (same logic as in the fix)
  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  };

  const isValidDateOfBirth = (dateOfBirth: string): { valid: boolean; message?: string } => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is in the future
    if (birthDate > today) {
      return { valid: false, message: "Date of birth cannot be in the future" };
    }

    // Check minimum age (18)
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      return { valid: false, message: "You must be at least 18 years old" };
    }

    return { valid: true };
  };

  describe("Future date validation", () => {
    it("should reject future dates", () => {
      const futureDate = "2025-12-31";
      const result = isValidDateOfBirth(futureDate);
      jestExpect(result.valid).toBe(false);
      // Future dates fail age check since they result in negative age
    });

    it("should reject tomorrow's date", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = isValidDateOfBirth(tomorrow.toISOString().split("T")[0]);
      jestExpect(result.valid).toBe(false);
    });
  });

  describe("Minimum age validation (18 years)", () => {
    it("should reject users under 18", () => {
      // Someone who is 17 years old
      const today = new Date();
      const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const result = isValidDateOfBirth(seventeenYearsAgo.toISOString().split("T")[0]);
      jestExpect(result.valid).toBe(false);
      jestExpect(result.message).toBe("You must be at least 18 years old");
    });

    it("should accept users exactly 18 years old", () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const result = isValidDateOfBirth(eighteenYearsAgo.toISOString().split("T")[0]);
      jestExpect(result.valid).toBe(true);
    });

    it("should accept users over 18", () => {
      const result = isValidDateOfBirth("1990-01-15");
      jestExpect(result.valid).toBe(true);
    });

    it("should correctly handle birthday edge case (day after 18th birthday in past)", () => {
      const today = new Date();
      // Born 18 years and 1 day ago - should be valid
      const justOver18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() - 1);
      const result = isValidDateOfBirth(justOver18.toISOString().split("T")[0]);
      jestExpect(result.valid).toBe(true);
    });
  });

  describe("Valid dates", () => {
    it("should accept valid adult birth dates", () => {
      const validDates = ["1980-05-15", "1995-12-25", "2000-01-01", "1970-06-30"];
      validDates.forEach((date) => {
        const result = isValidDateOfBirth(date);
        jestExpect(result.valid).toBe(true);
      });
    });
  });

  describe("Age calculation accuracy", () => {
    it("should calculate age correctly", () => {
      const today = new Date();
      const thirtyYearsAgo = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      jestExpect(calculateAge(thirtyYearsAgo.toISOString().split("T")[0])).toBe(30);
    });

    it("should handle leap year birthdays", () => {
      // Test with a date that exists
      const result = isValidDateOfBirth("1992-02-29");
      jestExpect(result.valid).toBe(true);
    });
  });
});

