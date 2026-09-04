import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  enforceAttendeePermission: vi.fn(),
  ensureMembersBelongToFamily: vi.fn(),
  requireParentContext: vi.fn(),
  requireScheduleActor: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/permissions/family", () => ({
  requireParentContext: mocks.requireParentContext,
}));
vi.mock("@/features/schedule/permissions", () => ({
  enforceAttendeePermission: mocks.enforceAttendeePermission,
  ensureMembersBelongToFamily: mocks.ensureMembersBelongToFamily,
  requireScheduleActor: mocks.requireScheduleActor,
}));

import { createScheduleEvent } from "@/features/schedule/actions";

const familyId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";
const existingEventId = "44444444-4444-4444-8444-444444444444";
const idempotencyKey = "55555555-5555-4555-8555-555555555555";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createScheduleEvent", () => {
  it("returns the existing event for a repeated idempotency key", async () => {
    const table = {
      eq: vi.fn(),
      insert: vi.fn().mockResolvedValue({
        error: { code: "23505", message: "duplicate key" },
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: existingEventId },
        error: null,
      }),
      select: vi.fn(),
    };
    table.eq.mockReturnValue(table);
    table.select.mockReturnValue(table);
    const writeClient = { from: vi.fn().mockReturnValue(table) };

    mocks.createClient.mockResolvedValue({});
    mocks.requireScheduleActor.mockResolvedValue({
      familyId,
      memberId,
      role: "parent",
      writeClient,
    });

    const result = await createScheduleEvent({}, createFormData());

    expect(result).toMatchObject({
      eventId: existingEventId,
      replayed: true,
      success: "Schedule event added.",
    });
    expect(table.insert).toHaveBeenCalledOnce();
    expect(writeClient.from).toHaveBeenCalledTimes(2);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/schedule");
  });
});

function createFormData() {
  const formData = new FormData();
  formData.set("familyId", familyId);
  formData.set("idempotencyKey", idempotencyKey);
  formData.set("wholeFamily", "on");
  formData.set("eventType", "family_event");
  formData.set("title", "Family picnic");
  formData.set("startsAt", "2026-09-12T14:30");
  formData.set("endsAt", "2026-09-12T15:30");
  formData.set("timeZone", "America/Regina");
  return formData;
}
