# SEC-304: Session Management Fix

## Purpose of the PR

Fixes SEC-304 - Multiple valid sessions per user with no invalidation.

## What caused the bug?

The original code allowed unlimited concurrent sessions per user:

```typescript
// Login - creates new session WITHOUT invalidating old ones
await db.insert(sessions).values({
  userId: user.id,
  token,
  expiresAt: expiresAt.toISOString(),
});

// Logout - only deletes current session token
if (token) {
  await db.delete(sessions).where(eq(sessions.token, token));
}
```

**Security risks:**
1. **Session accumulation**: Each login creates a new session, old sessions remain valid
2. **No forced logout**: If a user's credentials are compromised, attacker sessions persist
3. **Unauthorized access**: Old sessions on lost/stolen devices remain active
4. **No visibility**: Users can't see or manage their active sessions

## How did you fix it?

### 1. Single session policy on login

Invalidate all existing sessions before creating a new one:

```typescript
// Login
// Invalidate all existing sessions for this user (single session policy)
await db.delete(sessions).where(eq(sessions.userId, user.id));

// Then create new session
await db.insert(sessions).values({
  userId: user.id,
  token,
  expiresAt: expiresAt.toISOString(),
});
```

### 2. Complete logout (all devices)

Logout now invalidates ALL sessions for the user:

```typescript
// Logout
if (ctx.user) {
  // Delete ALL sessions for this user (invalidate all devices)
  await db.delete(sessions).where(eq(sessions.userId, ctx.user.id));
}
```

## What preventive measures can avoid similar issues?

1. **Single session policy**: Only one active session per user (implemented)
2. **Session limits**: If multiple sessions needed, limit to N sessions (e.g., 5)
3. **Session management UI**: Let users view and revoke active sessions
4. **Automatic cleanup**: Periodically delete expired sessions
5. **Security events**: Log session creation/invalidation for audit
6. **Password change invalidation**: Invalidate all sessions on password change

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

**Test 1: Single session policy**
1. Login on Browser A → session created
2. Login on Browser B → Browser A session should be invalidated
3. Refresh Browser A → should be logged out

**Test 2: Complete logout**
1. Login on Browser A
2. Login on Browser B (Browser A now logged out due to single session)
3. Logout on Browser B
4. Check database: no sessions should exist for this user

**Test 3: Database verification**
```bash
node scripts/db-utils.js list-sessions
```
- After login: exactly 1 session per user
- After logout: 0 sessions for that user

## Security considerations

| Aspect | Before | After |
|--------|--------|-------|
| Sessions per user | Unlimited | 1 (single session) |
| Login behavior | Adds session | Replaces all sessions |
| Logout behavior | Deletes current token | Deletes all user sessions |
| Compromised credential | Attacker keeps access | Attacker loses access on next login |
| Lost device | Session remains active | Session invalidated on next login |

