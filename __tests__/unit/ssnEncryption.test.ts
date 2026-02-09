/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";
import { encrypt, decrypt, maskSSN, getSSNLast4 } from "@/lib/crypto";

describe("SSN Encryption - SEC-301 (SSN Storage Security)", () => {
  describe("AES-256-GCM Encryption", () => {
    it("should encrypt SSN and produce different output than plaintext", () => {
      const ssn = "123456789";
      const encrypted = encrypt(ssn);

      // Encrypted should be different from original
      jestExpect(encrypted).not.toBe(ssn);
      // Encrypted should not contain the original SSN
      jestExpect(encrypted).not.toContain(ssn);
    });

    it("should decrypt SSN back to original value", () => {
      const ssn = "123456789";
      const encrypted = encrypt(ssn);
      const decrypted = decrypt(encrypted);

      jestExpect(decrypted).toBe(ssn);
    });

    it("should produce different ciphertext for same SSN (due to random IV)", () => {
      const ssn = "123456789";
      const encrypted1 = encrypt(ssn);
      const encrypted2 = encrypt(ssn);

      // Ciphertexts should be different due to random IV
      jestExpect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to original
      jestExpect(decrypt(encrypted1)).toBe(ssn);
      jestExpect(decrypt(encrypted2)).toBe(ssn);
    });

    it("should use proper format: iv:authTag:ciphertext", () => {
      const ssn = "123456789";
      const encrypted = encrypt(ssn);

      const parts = encrypted.split(":");
      jestExpect(parts.length).toBe(3);

      // All parts should be base64 encoded
      parts.forEach((part) => {
        jestExpect(() => Buffer.from(part, "base64")).not.toThrow();
      });
    });

    it("should detect tampering (authentication)", () => {
      const ssn = "123456789";
      const encrypted = encrypt(ssn);

      // Tamper with the ciphertext
      const parts = encrypted.split(":");
      parts[2] = "tampered" + parts[2];
      const tampered = parts.join(":");

      // Should throw on decryption due to auth tag mismatch
      jestExpect(() => decrypt(tampered)).toThrow();
    });
  });

  describe("SSN masking and last 4 digits", () => {
    it("should extract last 4 digits correctly", () => {
      jestExpect(getSSNLast4("123456789")).toBe("6789");
      jestExpect(getSSNLast4("000001234")).toBe("1234");
      jestExpect(getSSNLast4("999999999")).toBe("9999");
    });

    it("should mask SSN correctly for display", () => {
      jestExpect(maskSSN("123456789")).toBe("***-**-6789");
      jestExpect(maskSSN("000001234")).toBe("***-**-1234");
    });
  });

  describe("Security requirements", () => {
    it("should not expose plaintext SSN in encrypted output", () => {
      const ssn = "123456789";
      const encrypted = encrypt(ssn);

      // The encrypted data should not contain any part of the SSN
      jestExpect(encrypted).not.toContain("123");
      jestExpect(encrypted).not.toContain("456");
      jestExpect(encrypted).not.toContain("789");
      jestExpect(encrypted).not.toContain("6789");
    });

    it("should work with various SSN values", () => {
      const testSSNs = ["123456789", "000000000", "999999999", "111111111"];

      testSSNs.forEach((ssn) => {
        const encrypted = encrypt(ssn);
        const decrypted = decrypt(encrypted);
        jestExpect(decrypted).toBe(ssn);
      });
    });
  });
});

