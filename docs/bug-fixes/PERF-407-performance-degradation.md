# PERF-407: Performance Degradation Fix

## Purpose of the PR

Fixes PERF-407 - System slows down when processing multiple transactions.

## What caused the bug?

Classic **N+1 query problem** in `getTransactions`:

```typescript
// BEFORE - N+1 queries!
const enrichedTransactions = [];
for (const transaction of accountTransactions) {
  // This query runs for EACH transaction!
  const accountDetails = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, transaction.accountId))
    .get();

  enrichedTransactions.push({
    ...transaction,
    accountType: accountDetails?.accountType,
  });
}
```

**Performance impact:**
- 10 transactions = 11 queries (1 + 10)
- 100 transactions = 101 queries (1 + 100)
- 1000 transactions = 1001 queries (1 + 1000)

Each query has overhead (parsing, execution, network). With many transactions, this causes severe slowdown.

**The irony:** All transactions belong to the SAME account (we filter by `accountId`), and we already fetched that account earlier in the function!

## How did you fix it?

Reuse the account we already fetched:

```typescript
// AFTER - Just 2 queries total!
const account = await db
  .select()
  .from(accounts)
  .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
  .get();

// ... validation ...

const accountTransactions = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, input.accountId))
  .orderBy(desc(transactions.createdAt));

// Use the account we already fetched - no extra queries!
return accountTransactions.map((transaction) => ({
  ...transaction,
  accountType: account.accountType,
}));
```

**Performance improvement:**
- 10 transactions = 2 queries (constant)
- 100 transactions = 2 queries (constant)
- 1000 transactions = 2 queries (constant)

## What preventive measures can avoid similar issues?

1. **Watch for loops with database queries** - major red flag
2. **Use query analysis tools** to detect N+1 problems
3. **Batch queries** when you need data for multiple items
4. **Reuse data** you've already fetched
5. **Add performance tests** that fail on excessive queries

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

1. Create an account and fund it multiple times (10+ transactions)
2. View transaction history
3. Should load quickly regardless of transaction count

### Performance comparison

| Transactions | Before (queries) | After (queries) | Improvement |
|--------------|------------------|-----------------|-------------|
| 10           | 11               | 2               | 5.5x        |
| 100          | 101              | 2               | 50.5x       |
| 1000         | 1001             | 2               | 500.5x      |

