import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 32;
const saltLength = 16;

export async function hashChildPin(pin: string) {
  const salt = randomBytes(saltLength).toString("base64url");
  const derivedKey = (await scryptAsync(pin, salt, keyLength)) as Buffer;

  return `scrypt$1$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyChildPin(pin: string, storedHash: string) {
  const [algorithm, version, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || version !== "1" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = (await scryptAsync(pin, salt, expected.length)) as Buffer;

  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}
