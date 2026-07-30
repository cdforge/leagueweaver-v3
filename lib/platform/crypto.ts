import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function keyFromEnv() {
  const raw = process.env.PLATFORM_CREDENTIAL_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string) {
  const key = keyFromEnv();
  if (!key) throw new Error("Credential encryption is not configured.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const key = keyFromEnv();
  if (!key) throw new Error("Credential encryption is not configured.");
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Credential payload is invalid.");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}
