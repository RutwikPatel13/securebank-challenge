# PERF-406: Balance Calculation Errors

## Summary
- **Ticket**: PERF-406
- **Priority**: Critical
- **Reporter**: Finance Team
- **Status**: Fixed

## Problem Description
Account balances become incorrect after many transactions, causing critical financial discrepancies.

## Root Cause Analysis

### The Bug (server/routers/account.ts)

BEFORE:
```
// Update account balance
await db.update(accounts).set({
  balance: account.balance + amount,
}).where(eq(accounts.id, input.accountId));

// BUG: Bizarre loop to calculate returned balance
let finalBalance = account.balance;
for (let i = 0; i < 100; i++) {
  finalBalance = finalBalance + amount / 100;
}

return {
  transaction,
  newBalance: finalBalance, // This is WRONG!
};
```

**Problems:**
1. The loop adds `amount/100` 100 times instead of just adding `amount`
2. This can cause floating-point precision errors
3. The returned `newBalance` doesn't match what's stored in the database
4. Unnecessarily complex and confusing code

## The Fix

AFTER:
```
// Calculate new balance
const newBalance = account.balance + amount;

// Update account balance in database
await db.update(accounts).set({
  balance: newBalance,
}).where(eq(accounts.id, input.accountId));

return {
  transaction,
  newBalance,
};
```

**Key changes:**
1. Calculate `newBalance` once with simple addition
2. Use the same value for both DB update and return
3. Removed the unnecessary loop
4. Code is now clear and consistent

## Changes Made
- `server/routers/account.ts`: Replaced loop-based calculation with direct addition

## Preventive Measures
1. Keep calculations simple - avoid unnecessary complexity
2. Ensure returned values match what's stored in the database
3. Code review for "clever" code that's actually buggy
4. Use consistent variable naming (calculate once, use everywhere)
5. Consider using integer cents instead of float dollars for money

## How to Test
```
npm test -- --testPathPatterns="balanceCalculation" --no-coverage
```

**Manual test:**
1. Create an account
2. Fund with $100, verify balance shows $100
3. Fund with $50, verify balance shows $150
4. Fund with $25.50, verify balance shows $175.50

## Impact
- **Before fix**: Returned balance could be incorrect, causing UI/DB mismatch
- **After fix**: Balance is calculated correctly and consistently

