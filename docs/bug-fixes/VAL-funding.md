# VAL-205, VAL-207, VAL-209: Funding Form Validation Fixes

## Purpose of the PR

Fixes three related validation issues in the account funding form:

- **VAL-205**: Zero Amount Funding - System accepts $0.00 funding requests
- **VAL-207**: Routing Number Optional - Bank transfers submitted without routing numbers
- **VAL-209**: Amount Input Issues - System accepts amounts with multiple leading zeros

## What caused the bugs?

### VAL-205: Zero Amount Funding
- **Frontend**: `min: { value: 0.0 }` allowed $0.00 (checking against 0.0, not 0.01)
- **Backend**: `z.number().positive()` was correct but error message was generic

### VAL-207: Routing Number Optional
- **Frontend**: Routing number was required ✅
- **Backend**: `routingNumber: z.string().optional()` made it optional for ALL funding types, including bank transfers where it's mandatory

### VAL-209: Amount with Leading Zeros
- **Frontend**: Pattern `/^\d+\.?\d{0,2}$/` accepted "00100" or "007.50"
- No backend validation for leading zeros (processed as-is)

## How did you fix it?

### Frontend (`components/FundingModal.tsx`)

**Amount validation:**
```typescript
pattern: {
  // Reject multiple leading zeros (e.g., "00100" or "007.50")
  // Allow: "0.50", "100", "100.00", "0"
  value: /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
  message: "Invalid amount format (no leading zeros allowed)",
},
validate: {
  minAmount: (value) => {
    const num = parseFloat(value);
    return num >= 0.01 || "Amount must be at least $0.01";
  },
  maxAmount: (value) => {
    const num = parseFloat(value);
    return num <= 10000 || "Amount cannot exceed $10,000";
  },
},
```

### Backend (`server/routers/account.ts`)

**Zod schema with conditional validation:**
```typescript
z.object({
  accountId: z.number(),
  amount: z.number().min(0.01, "Amount must be at least $0.01"),
  fundingSource: z.object({
    type: z.enum(["card", "bank"]),
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
  }),
}).refine(
  (data) => data.fundingSource.type !== "bank" || !!data.fundingSource.routingNumber,
  {
    message: "Routing number is required for bank transfers",
    path: ["fundingSource", "routingNumber"],
  }
)
```

## What preventive measures can avoid similar issues?

1. **Use validate functions instead of min/max** for string-to-number comparisons
2. **Conditional validation with `.refine()`** for fields that depend on other fields
3. **Regex patterns that explicitly forbid invalid formats** (leading zeros)
4. **Defense in depth** - validate on both frontend and backend
5. **Test edge cases** - $0.00, empty strings, leading zeros, missing optional fields

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

**VAL-205 (Zero Amount):**
1. Go to Dashboard → Fund Account
2. Try entering "$0.00" or "0"
3. Verify error: "Amount must be at least $0.01"

**VAL-207 (Routing Number):**
1. Go to Dashboard → Fund Account
2. Select "Bank Account" as funding type
3. Try to submit without routing number
4. Verify error: "Routing number is required"
5. Select "Credit/Debit Card" - routing number should NOT be required

**VAL-209 (Leading Zeros):**
1. Go to Dashboard → Fund Account
2. Try entering "00100" or "007.50"
3. Verify error: "Invalid amount format (no leading zeros allowed)"
4. "100" and "0.50" should work fine

