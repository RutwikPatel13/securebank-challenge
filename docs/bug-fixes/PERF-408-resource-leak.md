# PERF-408: Resource Leak (DB Connections)

## Summary
- **Ticket**: PERF-408
- **Priority**: Critical
- **Reporter**: DevOps Team
- **Status**: Fixed

## Problem Description
Database connections remain open, causing system resource exhaustion.

## Root Cause Analysis

### The Bug (lib/db/index.ts)

BEFORE:
```
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

const connections: Database.Database[] = [];

export function initDb() {
  const conn = new Database(dbPath);  // BUG: Creates NEW connection
  connections.push(conn);              // BUG: Never closed!

  // But uses 'sqlite' to create tables, not 'conn'
  sqlite.exec(`CREATE TABLE IF NOT EXISTS...`);
}

initDb();
```

**Problems:**
1. `initDb()` creates a new Database connection (`conn`) every time called
2. The connection is pushed to `connections` array but **never closed**
3. The `conn` variable is never actually used - `sqlite` is used instead
4. If `initDb()` is called multiple times (hot reload), connections accumulate
5. Each unclosed connection holds file handles and memory

## The Fix

AFTER:
```
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export function initDb() {
  // Create tables using the existing connection
  sqlite.exec(`CREATE TABLE IF NOT EXISTS...`);
}

initDb();
```

**Key changes:**
1. Removed the useless `connections` array
2. Removed the unnecessary `new Database()` call in `initDb()`
3. Use the existing `sqlite` connection for all operations
4. Single connection is reused throughout the application

## Changes Made
- `lib/db/index.ts`: Removed connection leak, use single shared connection

## Preventive Measures
1. Use singleton pattern for database connections
2. Never create connections without a cleanup strategy
3. Code review for resource management (connections, file handles, etc.)
4. Add monitoring for open file descriptors in production
5. Use connection pooling for high-traffic applications

## How to Test
```
npm test -- --testPathPatterns="dbConnection" --no-coverage
```

**Manual verification:**
1. Start the dev server: `npm run dev`
2. Navigate through the app, perform multiple operations
3. Check system resources - file handles should remain stable
4. In production, monitor with: `lsof -p <pid> | grep bank.db`

## Impact
- **Before fix**: Each hot reload or import could create orphaned connections
- **After fix**: Single connection reused, no resource accumulation

