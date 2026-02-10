/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Dark Mode Input Styling - UI-101", () => {
  let globalsCss: string;

  beforeAll(() => {
    const cssPath = path.join(process.cwd(), "app/globals.css");
    globalsCss = fs.readFileSync(cssPath, "utf-8");
  });

  describe("CSS contains dark mode fix", () => {
    it("should have explicit input text color", () => {
      // Check that input elements have explicit color set
      jestExpect(globalsCss).toContain("color: #171717");
    });

    it("should have explicit input background color", () => {
      // Check that input elements have explicit background color
      jestExpect(globalsCss).toContain("background-color: #ffffff");
    });

    it("should style textarea elements", () => {
      // Check that textarea is also styled
      jestExpect(globalsCss).toMatch(/textarea/);
    });

    it("should style select elements", () => {
      // Check that select is also styled
      jestExpect(globalsCss).toMatch(/select/);
    });

    it("should have placeholder styling", () => {
      // Check that placeholder text is styled
      jestExpect(globalsCss).toMatch(/::placeholder/);
    });
  });

  describe("Dark mode CSS variables", () => {
    it("should have dark mode media query", () => {
      jestExpect(globalsCss).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
    });

    it("should set light foreground color in dark mode", () => {
      // In dark mode, foreground should be light
      jestExpect(globalsCss).toMatch(/--foreground:\s*#ededed/);
    });

    it("should set dark background in dark mode", () => {
      // In dark mode, background should be dark
      jestExpect(globalsCss).toMatch(/--background:\s*#0a0a0a/);
    });
  });

  describe("Color contrast requirements", () => {
    it("should use dark text color for inputs (#171717)", () => {
      // Dark text for readability
      const inputTextColor = "#171717";
      jestExpect(globalsCss).toContain(inputTextColor);
    });

    it("should use white background for inputs (#ffffff)", () => {
      // White background for contrast
      const inputBgColor = "#ffffff";
      jestExpect(globalsCss).toContain(inputBgColor);
    });

    it("should use gray placeholder color (#9ca3af)", () => {
      // Gray placeholder for visibility
      const placeholderColor = "#9ca3af";
      jestExpect(globalsCss).toContain(placeholderColor);
    });
  });
});

