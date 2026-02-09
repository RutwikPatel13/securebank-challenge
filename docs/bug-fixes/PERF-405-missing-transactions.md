# PERF-405: Missing Transactions

## Summary
- **Ticket**: PERF-405
- **Priority**: Critical
- **Reporter**: Multiple Users
- **Status**: Fixed

## Problem Description
Not all transactions appear in history after multiple funding events. Users reported that after funding their account multiple times, they couldn't see all their transactions.

## Root Cause Analysis

### The Bug (`server/routers/account.ts`)
```typescript
// BEFORE - Fetches the OLDEST transaction, not the newly created one
const transaction = await db
  .select()
  .from(transactions)
  .orderBy(transactions.createdAt)  // Ascending order = oldest first!
  .limit(1)
  .get();
```

**What went wrong:**
1. `orderBy(transactions.createdAt)` uses **ascending order** by default
2. Ascending order returns the **oldest** transaction first
3. `limit(1)` then takes only that oldest transaction
4. No filter by `accountId` - could return transactions from other accounts!

**Result:**
- 1st funding → returns transaction 1 (correct by accident)
- 2nd funding → returns transaction 1 (wrong - should be 2)
- 3rd funding → returns transaction 1 (wrong - should be 3)

The transactions WERE being created in the database, but the API returned the wrong transaction object, causing confusion in the UI.

## The Fix

```typescript
// AFTER - Fetches the most recent transaction for this account
const transaction = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, input.accountId))  // Filter by account
  .orderBy(desc(transactions.id))  // Descending order = newest first
  .limit(1)
  .get();
```

**Key changes:**
1. Added `where(eq(transactions.accountId, input.accountId))` - filter by account
2. Changed to `orderBy(desc(transactions.id))` - descending order by ID
3. Using `id` instead of `createdAt` is more reliable (auto-increment guarantees order)

## Changes Made
- `server/routers/account.ts`: 
  - Added `desc` import from drizzle-orm
  - Fixed transaction fetch query to use descending order and filter by accountId

## Preventive Measures
1. **Always specify sort direction explicitly** - Don't rely on default ascending
2. **Filter by relevant foreign key** - When fetching related records, always filter
3. **Use auto-increment ID for ordering** - More reliable than timestamps
4. **Write integration tests** - Test multiple sequential operations
5. **Code review checklist** - "Does this query return what we expect?"

## How to Test
```bash
npm test -- --testPathPatterns="transactionFetch" --no-coverage
```

**Manual test:**
1. Create an account
2. Fund the account 3 times with different amounts ($100, $200, $300)
3. Check transaction history - all 3 transactions should appear
4. Each funding response should show the correct amount

## Impact
- **Before fix**: Only first transaction returned after multiple fundings
- **After fix**: Most recent transaction correctly returned for each funding

