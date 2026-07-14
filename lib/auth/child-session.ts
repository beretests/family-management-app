import { cookies } from "next/headers";
import {
  type ChildSessionPayload,
  signChildSessionPayload,
  verifyChildSessionToken,
} from "@/lib/auth/child-session-token";

export const CHILD_SESSION_COOKIE = "family_app_child_session";
export const CHILD_SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

function getChildSessionSecret() {
  return process.env.CHILD_SESSION_SECRET;
}

export function isChildSessionConfigured() {
  return Boolean(getChildSessionSecret());
}

export function buildChildSessionPayload({
  familyId,
  memberId,
  parentMemberId,
  parentProfileId,
}: Omit<ChildSessionPayload, "expiresAt">): ChildSessionPayload {
  return {
    familyId,
    memberId,
    parentMemberId,
    parentProfileId,
    expiresAt: new Date(
      Date.now() + CHILD_SESSION_MAX_AGE_SECONDS * 1000,
    ).toISOString(),
  };
}

export async function getChildSessionPayload() {
  const secret = getChildSessionSecret();

  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value;

  return token ? verifyChildSessionToken(token, secret) : null;
}

export async function setChildSessionPayload(payload: ChildSessionPayload) {
  const secret = getChildSessionSecret();

  if (!secret) {
    throw new Error("Set CHILD_SESSION_SECRET to use Kid Mode.");
  }

  const cookieStore = await cookies();
  cookieStore.set(CHILD_SESSION_COOKIE, signChildSessionPayload(payload, secret), {
    httpOnly: true,
    maxAge: CHILD_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearChildSessionPayload() {
  const cookieStore = await cookies();
  cookieStore.delete(CHILD_SESSION_COOKIE);
}
