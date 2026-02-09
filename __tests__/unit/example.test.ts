/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

/**
 * Example unit test to verify Jest setup is working correctly.
 * This file can be deleted once real tests are added.
 */

describe("Jest Setup Verification", () => {
  it("should run basic assertions", () => {
    jestExpect(1 + 1).toBe(2);
  });

  it("should handle string assertions", () => {
    jestExpect("SecureBank").toContain("Bank");
  });

  it("should handle array assertions", () => {
    const accounts = ["checking", "savings"];
    jestExpect(accounts).toHaveLength(2);
    jestExpect(accounts).toContain("checking");
  });

  it("should handle object assertions", () => {
    const user = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    };
    jestExpect(user).toHaveProperty("email");
    jestExpect(user.email).toBe("test@example.com");
  });

  it("should handle async operations", async () => {
    const fetchData = (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve("data"), 100);
      });
    };
    const result = await fetchData();
    jestExpect(result).toBe("data");
  });
});

