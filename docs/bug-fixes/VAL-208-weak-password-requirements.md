# VAL-208: Weak Password Requirements

## Summary
- **Ticket**: VAL-208
- **Priority**: Critical
- **Reporter**: Security Team
- **Status**: Fixed

## Problem Description
Password validation only checked length (minimum 8 characters), not complexity. This created significant account security risks as users could create easily guessable passwords.

## Root Cause Analysis

### Backend (`server/routers/auth.ts`)
```typescript
// BEFORE - Only checked length
password: z.string().min(8),
```

### Frontend (`app/signup/page.tsx`)
```typescript
// BEFORE - Incomplete validation
validate: {
  notCommon: (value) => { /* only 3 common passwords */ },
  hasNumber: (value) => /\d/.test(value) || "Password must contain a number",
}
```

**Issues:**
- Backend had NO complexity requirements at all
- Frontend only required a number
- No uppercase, lowercase, or special character requirements
- Common password list was very limited (only 3 passwords)

## The Fix

### Backend - Added Zod regex validation
```typescript
password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
```

### Frontend - Added validate rules
```typescript
validate: {
  notCommon: (value) => { /* check common passwords */ },
  hasUppercase: (value) => /[A-Z]/.test(value) || "...",
  hasLowercase: (value) => /[a-z]/.test(value) || "...",
  hasNumber: (value) => /[0-9]/.test(value) || "...",
  hasSpecialChar: (value) => /[^A-Za-z0-9]/.test(value) || "...",
}
```

## Changes Made
- `server/routers/auth.ts`: Added comprehensive Zod password validation
- `app/signup/page.tsx`: Added React Hook Form validation rules

## Preventive Measures
1. **Defense in depth** - Always validate on BOTH frontend AND backend
2. **Use industry standards** - NIST recommends complexity requirements
3. **Consider password strength meters** - Visual feedback helps users
4. **Expand common password list** - Use larger blacklists like Have I Been Pwned
5. **Add rate limiting** - Prevent brute force attacks

## How to Test
1. **Unit tests**:
   ```bash
   npm test -- --testPathPatterns="passwordValidation" --no-coverage
   ```

2. **Manual testing**:
   - Try `password` → Should fail (no uppercase, number, special)
   - Try `Password1` → Should fail (no special character)
   - Try `Password1!` → Should pass

## Impact
- **Before fix**: Weak passwords like "password" or "12345678" could be used
- **After fix**: Strong passwords required with uppercase, lowercase, number, and special character

