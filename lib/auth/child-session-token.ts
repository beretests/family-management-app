import { createHmac, timingSafeEqual } from "node:crypto";

export type ChildSessionPayload = {
  familyId: string;
  memberId: string;
  parentMemberId: string;
  parentProfileId: string;
  expiresAt: string;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isPayload(value: unknown): value is ChildSessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.familyId === "string" &&
    typeof candidate.memberId === "string" &&
    typeof candidate.parentMemberId === "string" &&
    typeof candidate.parentProfileId === "string" &&
    typeof candidate.expiresAt === "string"
  );
}

export function signChildSessionPayload(
  payload: ChildSessionPayload,
  secret: string,
) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyChildSessionToken(
  token: string,
  secret: string,
  now = new Date(),
) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;

    if (!isPayload(payload) || new Date(payload.expiresAt) <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
