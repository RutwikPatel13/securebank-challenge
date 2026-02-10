# VAL-201, VAL-203, VAL-204: Registration Form Validation Fixes

## Purpose of the PR

Fixes three related validation issues in the user registration form:

- **VAL-201**: Email validation problems (accepts invalid formats, silent lowercase conversion, no typo detection)
- **VAL-203**: State code validation (accepts invalid codes like "XX")
- **VAL-204**: Phone number format (inconsistent validation between frontend and backend)

## What caused the bugs?

### VAL-201: Email Validation
- Backend silently converted email to lowercase without notifying user
- Frontend pattern `/^\S+@\S+$/i` was too permissive
- No detection of common typos like "gmail.con" or "gmial.com"

### VAL-203: State Code Validation
- Only checked for 2 uppercase letters (`/^[A-Z]{2}$/`)
- Did not validate against actual US state codes
- Accepted invalid codes like "XX", "ZZ", etc.

### VAL-204: Phone Number Format
- Frontend only accepted exactly 10 digits
- Backend accepted 10-15 digits with optional `+`
- No proper international format validation
- Mismatch caused confusion and validation failures

## How did you fix it?

### 1. Created shared validation utilities (`lib/validation.ts`)
- `US_STATE_CODES` - Array of valid US state codes (50 states + DC + territories)
- `EMAIL_TYPO_DOMAINS` - Map of common email typos to correct domains
- `checkEmailTypo()` - Detects typos and suggests corrections
- `isValidPhoneNumber()` - Validates US and international phone formats
- `isValidStateCode()` - Validates against actual state codes

### 2. Updated backend validation (`server/routers/auth.ts`)
- Email: Uses `.transform()` for lowercase, `.refine()` for typo detection
- Phone: Uses shared `isValidPhoneNumber()` function
- State: Uses `.transform()` for uppercase, validates against `US_STATE_CODES`

### 3. Updated frontend validation (`app/signup/page.tsx`)
- Email: Better regex pattern + typo detection via `checkEmailTypo()`
- Phone: Uses `isValidPhoneNumber()` with helpful error message
- State: Uses `isValidStateCode()` with `maxLength={2}` and uppercase CSS

## What preventive measures can avoid similar issues?

1. **Shared validation code** - Frontend and backend use the same validation functions
2. **Defense in depth** - Validate on both frontend (UX) and backend (security)
3. **Explicit transformations** - Use Zod's `.transform()` to make data normalization visible
4. **Helpful error messages** - Suggest corrections instead of just rejecting input
5. **Comprehensive test coverage** - Test edge cases and invalid inputs

## How to test it?

### Manual Testing

1. **Email typo detection**:
   - Enter `test@gmial.com` → Should show "Did you mean test@gmail.com?"
   - Enter `test@gmail.con` → Should show suggestion

2. **State code validation**:
   - Enter `XX` → Should show "Invalid US state code"
   - Enter `CA` or `ca` → Should accept (auto-uppercase)

3. **Phone number validation**:
   - Enter `1234567890` → Should accept (US format)
   - Enter `+1-123-456-7890` → Should accept (formatted)
   - Enter `+44 20 7946 0958` → Should accept (international)
   - Enter `12345` → Should reject (too short)

### Automated Testing

```bash
npm test -- --no-coverage
```

All 73 tests should pass.

