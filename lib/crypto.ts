import crypto from "crypto";

// AES-256-GCM encryption for sensitive PII data like SSN
// GCM mode provides both encryption and authentication (integrity check)

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits authentication tag

// Get encryption key from environment or use a default for development
// In production, this MUST be set via environment variable and stored securely (e.g., AWS KMS, HashiCorp Vault)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // For development/testing only - in production, this should throw an error
    console.warn("WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!");
    // Generate a deterministic key for development (32 bytes = 256 bits)
    return crypto.scryptSync("development-key-do-not-use-in-production", "salt", 32);
  }
  
  // Key should be base64 encoded 32-byte key
  const keyBuffer = Buffer.from(key, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte (256-bit) key encoded in base64");
  }
  return keyBuffer;
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all base64 encoded, colon-separated)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts data encrypted with encrypt()
 * Input format: iv:authTag:encryptedData (all base64 encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }
  
  const [ivBase64, authTagBase64, encrypted] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Masks SSN for display purposes
 * Input: "123456789" -> Output: "***-**-6789"
 */
export function maskSSN(ssn: string): string {
  const last4 = ssn.slice(-4);
  return `***-**-${last4}`;
}

/**
 * Extracts last 4 digits of SSN for storage
 */
export function getSSNLast4(ssn: string): string {
  return ssn.slice(-4);
}

