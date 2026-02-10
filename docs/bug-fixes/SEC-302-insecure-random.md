# SEC-302: Insecure Random Numbers Fix

## Purpose of the PR

Fixes SEC-302 - Account numbers generated using `Math.random()` which is not cryptographically secure.

## What caused the bug?

The original code used `Math.random()` to generate account numbers:

```typescript
function generateAccountNumber(): string {
  return Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
}
```

**Why is this a security issue?**

1. **Predictability**: `Math.random()` uses a PRNG (Pseudo-Random Number Generator) that is NOT cryptographically secure. If an attacker can observe enough outputs, they can predict future values.

2. **Internal State Exposure**: The internal state of `Math.random()` can be reconstructed from ~600 consecutive outputs, allowing prediction of all future values.

3. **Financial Risk**: Predictable account numbers could allow attackers to:
   - Guess valid account numbers for social engineering attacks
   - Enumerate accounts in the system
   - Target specific accounts for fraud

## How did you fix it?

Replaced `Math.random()` with `crypto.randomInt()`:

```typescript
import crypto from "crypto";

function generateAccountNumber(): string {
  // crypto.randomInt() uses a CSPRNG and is safe for security-sensitive use
  // Generate a number between 0 and 9999999999 (10 digits)
  return crypto.randomInt(0, 10000000000).toString().padStart(10, "0");
}
```

**Why `crypto.randomInt()`?**

1. **CSPRNG**: Uses a Cryptographically Secure Pseudo-Random Number Generator
2. **Node.js Native**: Built into Node.js, no external dependencies
3. **Unpredictable**: Cannot be predicted even with knowledge of previous outputs
4. **Uniform Distribution**: Provides uniform distribution across the range

## What preventive measures can avoid similar issues?

1. **Never use `Math.random()` for security-sensitive values**:
   - Account numbers
   - Session tokens
   - Password reset tokens
   - API keys
   - Any identifier that should not be guessable

2. **Use appropriate crypto APIs**:
   - `crypto.randomInt()` - for random integers in a range
   - `crypto.randomBytes()` - for random byte sequences
   - `crypto.randomUUID()` - for UUIDs

3. **Security code review checklist**:
   - Search for `Math.random()` in security-sensitive code
   - Verify all random values use crypto module
   - Document why crypto is needed in comments

4. **Linting rules**: Consider adding ESLint rules to flag `Math.random()` usage in sensitive files.

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual verification

The change is internal and doesn't affect the API. To verify:

1. Create a new account via the dashboard
2. Check that the account number is 10 digits
3. The account number should be unpredictable (no pattern)

### Security verification

```javascript
// Old (INSECURE) - predictable pattern
Math.random() // 0.123456789...

// New (SECURE) - cryptographically random
crypto.randomInt(0, 10000000000) // Unpredictable
```

## References

- [Node.js crypto.randomInt()](https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback)
- [OWASP Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-330: Use of Insufficiently Random Values](https://cwe.mitre.org/data/definitions/330.html)

