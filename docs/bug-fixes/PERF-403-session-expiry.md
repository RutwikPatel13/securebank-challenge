# PERF-403: Session Expiry Fix

## Purpose of the PR

Fixes PERF-403 - Expiring sessions still considered valid until exact expiry time.

## What caused the bug?

The original code only checked if the session expiry time was in the future:

```
if (session && new Date(session.expiresAt) > new Date()) {
  // Session is valid
}
```

Problems:
1. **Race condition**: A request could start with a valid session but the session could expire mid-request
2. **No buffer**: Sessions expiring in 1 second were still considered valid
3. **Security risk**: Near-expiry sessions could be exploited in timing attacks

## How did you fix it?

Added a 30-second buffer period before session expiry:

1. Sessions within 30 seconds of expiry are treated as expired
2. Nearly-expired sessions are automatically cleaned up from the database
3. Clear separation between valid, buffer-period, and expired states

The fix ensures:
- Sessions are invalidated 30 seconds before actual expiry
- No race conditions during request processing
- Automatic cleanup of nearly-expired sessions

## What preventive measures can avoid similar issues?

1. **Always use buffer periods** for time-sensitive security checks
2. **Consider request duration** when validating time-based tokens
3. **Clean up expired data** proactively, not just on exact expiry
4. **Test edge cases** around expiry boundaries

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

1. Create a session with short expiry (modify code temporarily)
2. Wait until within 30 seconds of expiry
3. Make a request - should be rejected as expired
4. Check database - session should be deleted

### Expected behavior

| Time to Expiry | Old Behavior | New Behavior |
|----------------|--------------|--------------|
| > 30 seconds | Valid | Valid |
| 1-30 seconds | Valid (BUG) | Expired + Cleanup |
| 0 or negative | Expired | Expired |

