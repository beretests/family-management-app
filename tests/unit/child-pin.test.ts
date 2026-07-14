import { describe, expect, it } from "vitest";
import { hashChildPin, verifyChildPin } from "@/lib/auth/pin";

describe("child PIN hashing", () => {
  it("stores a salted hash and verifies only the matching PIN", async () => {
    const hash = await hashChildPin("1234");

    expect(hash).not.toContain("1234");
    await expect(verifyChildPin("1234", hash)).resolves.toBe(true);
    await expect(verifyChildPin("9999", hash)).resolves.toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyChildPin("1234", "not-a-valid-hash")).resolves.toBe(
      false,
    );
  });
});
