// Shared validation utilities for registration form
// Used by both frontend (app/signup/page.tsx) and backend (server/routers/auth.ts)

// Valid US state codes (50 states + DC and territories)
export const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI", "GU", "AS", "MP",
] as const;

export type USStateCode = (typeof US_STATE_CODES)[number];

// Common email typos to detect and suggest corrections
export const EMAIL_TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
};

/**
 * Check if email has a common typo in the domain
 * @returns Error message with suggestion, or true if valid
 */
export function checkEmailTypo(email: string): string | true {
  const domain = email.toLowerCase().split("@")[1];
  if (domain && EMAIL_TYPO_DOMAINS[domain]) {
    return `Did you mean ${email.toLowerCase().replace(domain, EMAIL_TYPO_DOMAINS[domain])}?`;
  }
  return true;
}

/**
 * Validate phone number (US or international format)
 * Accepts: 10 digits, +1 prefix, or international +country code format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // US format: 10 digits, optionally with +1 prefix
  if (/^\+?1?\d{10}$/.test(cleaned)) return true;
  // International format: + followed by 11-14 digits
  if (/^\+\d{11,14}$/.test(cleaned)) return true;
  return false;
}

/**
 * Validate US state code
 */
export function isValidStateCode(state: string): boolean {
  return US_STATE_CODES.includes(state.toUpperCase() as USStateCode);
}

