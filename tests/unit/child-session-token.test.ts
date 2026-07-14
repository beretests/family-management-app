import { describe, expect, it } from "vitest";
import {
  signChildSessionPayload,
  verifyChildSessionToken,
  type ChildSessionPayload,
} from "@/lib/auth/child-session-token";

const payload: ChildSessionPayload = {
  expiresAt: "2099-01-01T00:00:00.000Z",
  familyId: "22222222-2222-4222-8222-222222222222",
  memberId: "33333333-3333-4333-8333-333333333333",
  parentMemberId: "44444444-4444-4444-8444-444444444444",
  parentProfileId: "55555555-5555-4555-8555-555555555555",
};

describe("child session token", () => {
  it("round-trips a signed payload", () => {
    const token = signChildSessionPayload(payload, "test-secret");

    expect(verifyChildSessionToken(token, "test-secret")).toEqual(payload);
  });

  it("rejects tampered signatures and expired tokens", () => {
    const token = signChildSessionPayload(payload, "test-secret");
    const [encodedPayload] = token.split(".");
    const expiredToken = signChildSessionPayload(
      { ...payload, expiresAt: "2020-01-01T00:00:00.000Z" },
      "test-secret",
    );

    expect(
      verifyChildSessionToken(`${encodedPayload}.bad-signature`, "test-secret"),
    ).toBeNull();
    expect(verifyChildSessionToken(token, "other-secret")).toBeNull();
    expect(verifyChildSessionToken(expiredToken, "test-secret")).toBeNull();
  });
});
