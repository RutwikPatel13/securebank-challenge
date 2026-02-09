# SEC-301: SSN Storage Security

## Summary
- **Ticket**: SEC-301
- **Priority**: Critical
- **Reporter**: Security Audit Team
- **Status**: Fixed

## Problem Description
Social Security Numbers (SSNs) were stored in plaintext in the database. This is a severe privacy and compliance risk (PCI-DSS, SOC 2, HIPAA).

## Root Cause Analysis

### Database Schema (`lib/db/schema.ts`)
```typescript
// BEFORE - SSN stored in plaintext
ssn: text("ssn").notNull(),
```

**Issues:**
- SSN stored in plaintext - anyone with DB access could read all SSNs
- No encryption applied
- Severe compliance violation (PCI-DSS, SOC 2, HIPAA)
- Data breach would expose all customer SSNs

## Why Encryption (not Hashing)?

**Hashing (bcrypt) is NOT appropriate for SSN because:**
1. SSNs are only 9 digits (1 billion combinations) - easily brute-forced
2. Cannot retrieve SSN for compliance needs (IRS reporting, identity verification)
3. Hashing is one-way - no way to recover original value

**AES-256-GCM Encryption is the correct approach:**
1. Industry standard for PII protection
2. Reversible with proper key management (for compliance needs)
3. GCM mode provides authentication (detects tampering)
4. 256-bit key makes brute-force infeasible

## The Fix

### 1. Created encryption utility (`lib/crypto.ts`)
```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  // Returns: iv:authTag:ciphertext (all base64)
}

export function decrypt(encryptedData: string): string {
  // Reverses encryption, verifies auth tag
}
```

### 2. Updated auth router
```typescript
import { encrypt, getSSNLast4 } from "@/lib/crypto";

// Encrypt SSN using AES-256-GCM
const encryptedSsn = encrypt(input.ssn);
const ssnLast4 = getSSNLast4(input.ssn);
```

### 3. Exclude encrypted SSN from API responses
```typescript
return { user: { ...user, password: undefined, ssn: undefined }, token };
```

## Changes Made
- `lib/crypto.ts`: New AES-256-GCM encryption utility
- `lib/db/schema.ts`: Added `ssnLast4` field for display
- `lib/db/index.ts`: Updated table creation SQL
- `server/routers/auth.ts`: Encrypt SSN before storing

## Security Features
1. **AES-256-GCM** - Military-grade encryption with authentication
2. **Random IV** - Each encryption produces different ciphertext
3. **Auth Tag** - Detects any tampering with encrypted data
4. **Key Management** - Key from environment variable (use KMS in production)
5. **Last 4 only** - Only last 4 digits stored for display

## Preventive Measures
1. **Use encryption for all PII** - SSN, DOB, addresses
2. **Proper key management** - Use AWS KMS, HashiCorp Vault in production
3. **Key rotation** - Implement periodic key rotation
4. **Audit logging** - Log all access to sensitive data
5. **Principle of least privilege** - Limit who can access encryption keys

## How to Test
```bash
npm test -- --testPathPatterns="ssnEncryption" --no-coverage
```

## Impact
- **Before**: SSNs in plaintext - severe security/compliance risk
- **After**: SSNs encrypted with AES-256-GCM, only last 4 digits for display

