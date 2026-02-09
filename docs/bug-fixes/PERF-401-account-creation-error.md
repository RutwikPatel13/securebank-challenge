# PERF-401: Account Creation Error

## Summary
- **Ticket**: PERF-401
- **Priority**: Critical
- **Reporter**: Support Team
- **Status**: Fixed

## Problem Description
New accounts were showing a $100 balance when database operations failed, instead of properly reporting the error to the user.

## Root Cause Analysis

In `server/routers/account.ts`, the `createAccount` mutation had a fallback return value when the account fetch failed after insert:

```typescript
// BEFORE (buggy code)
const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

return (
  account || {
    id: 0,
    userId: ctx.user.id,
    accountNumber: accountNumber!,
    accountType: input.accountType,
    balance: 100,  // BUG: Incorrect fallback balance!
    status: "pending",
    createdAt: new Date().toISOString(),
  }
);
```

When the database insert succeeded but the subsequent fetch failed (due to race conditions, DB issues, etc.), the code would return a fake account object with:
- `balance: 100` (incorrect - should be 0)
- `status: "pending"` (incorrect - should be "active")
- `id: 0` (invalid ID)

## The Fix

Replace the fallback object with proper error handling:

```typescript
// AFTER (fixed code)
const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

if (!account) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to create account",
  });
}

return account;
```

## Changes Made
- `server/routers/account.ts`: Replaced fallback object with TRPCError throw

## Preventive Measures

1. **Never use fallback objects for database operations** - If a DB operation fails, throw an error
2. **Validate return values** - Always check if database operations returned expected data
3. **Use TypeScript strict mode** - Helps catch potential null/undefined issues
4. **Add integration tests** - Test the full account creation flow including error scenarios
5. **Code review checklist** - Check for fallback values that could mask errors

## How to Test

1. **Unit tests**: 
   ```bash
   npm test -- --testPathPatterns="accountCreation" --no-coverage
   ```

2. **Manual testing**:
   - Create a new account and verify balance is $0
   - Check that error messages are properly displayed when creation fails
   - Verify no accounts show $100 balance incorrectly

## Impact
- **Before fix**: Users could see incorrect $100 balance, leading to confusion and potential financial discrepancies
- **After fix**: Users receive clear error message if account creation fails, and successful accounts always show correct $0 initial balance

