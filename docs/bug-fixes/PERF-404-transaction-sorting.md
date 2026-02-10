# PERF-404: Transaction Sorting Fix

## Purpose of the PR

Fixes PERF-404 - Transaction order seems random sometimes.

## What caused the bug?

The `getTransactions` query had no `orderBy` clause:

```
const accountTransactions = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, input.accountId));
```

Without explicit ordering:
- Database returns rows in undefined order
- Usually insertion order, but NOT guaranteed
- Can vary based on database internals, indexes, or query optimization
- Results in "random" ordering for users

## How did you fix it?

Added explicit `orderBy` clause to sort by `createdAt` descending (newest first):

```
const accountTransactions = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, input.accountId))
  .orderBy(desc(transactions.createdAt));
```

This ensures:
- Consistent ordering across all queries
- Newest transactions appear first (most useful for users)
- Predictable behavior regardless of database internals

## What preventive measures can avoid similar issues?

1. **Always specify ORDER BY** for user-facing lists
2. **Never rely on implicit database ordering**
3. **Document expected sort order** in API contracts
4. **Add tests for ordering** to catch regressions

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

1. Login and create an account
2. Fund the account multiple times with different amounts
3. View transaction history
4. Transactions should appear newest first (most recent at top)
5. Refresh page - order should remain consistent

### Expected behavior

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| View transactions | Random/undefined order | Newest first |
| Page refresh | Order may change | Consistent order |
| Multiple fundings | Unpredictable display | Chronological (newest first) |

