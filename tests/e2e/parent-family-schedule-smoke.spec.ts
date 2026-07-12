import { expect, test, type Page } from "@playwright/test";
import { createConfirmedParentUser } from "./supabase-local";

test.describe("parent family schedule smoke flow", () => {
  test("establishes a local parent session, creates a family, adds a child, and creates a schedule event", async ({
    page,
  }) => {
    test.slow();

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `parent-${runId}@example.com`;
    const password = "FamilyTest123!";
    const familyName = `E2E Family ${runId}`;
    const parentName = `Parent ${runId}`;
    const childName = `Ari ${runId}`;
    const eventTitle = `Soccer practice ${runId}`;

    await createConfirmedParentUser({ email, password });
    await signInWithLocalSession(page, email, password);

    await page.goto("/family/setup");
    await expect(
      page.getByRole("heading", { name: "Create your family workspace" }),
    ).toBeVisible();

    await page.getByLabel("Family name").fill(familyName);
    await page.getByLabel("Your display name").fill(parentName);
    await page.getByRole("button", { name: "Create family" }).click();

    await expect(page).toHaveURL(/\/settings\/family/);
    await expect(page.getByRole("heading", { name: familyName })).toBeVisible();

    const childForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Add child" }),
    });
    await childForm.getByLabel("Name").fill(childName);
    await childForm.getByLabel("Age").fill("8");
    await childForm.getByLabel("Ability level").selectOption("3");
    await childForm
      .getByLabel("Preferences, dislikes, and safety notes")
      .fill("Dislikes cleaning bathrooms.");
    await childForm.getByRole("button", { name: "Add child" }).click();

    const childCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(childCard).toBeVisible();
    await expect(childCard.getByText("Dislikes cleaning bathrooms.").first()).toBeVisible();

    await page.goto("/schedule?date=2026-07-12&view=day");
    await expect(
      page.getByRole("heading", { name: "Sunday, July 12" }),
    ).toBeVisible();

    const scheduleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Add event" }),
    });
    await scheduleForm.getByLabel("Title").fill(eventTitle);
    await scheduleForm.getByLabel("Type").selectOption("extracurricular");
    await scheduleForm.getByLabel("Starts").fill("2026-07-12T16:00");
    await scheduleForm.getByLabel("Ends").fill("2026-07-12T17:00");
    await scheduleForm.getByLabel("Family member").selectOption({
      label: childName,
    });
    await scheduleForm.getByLabel("Location").fill("Community field");
    await scheduleForm.getByLabel("Notes").fill("Bring water bottle.");
    await scheduleForm.getByRole("button", { name: "Add event" }).click();

    const eventCard = page
      .getByRole("heading", { name: eventTitle })
      .locator("xpath=ancestor::article[1]");
    await expect(eventCard).toBeVisible();
    await expect(eventCard.getByText("Community field").first()).toBeVisible();
    await expect(eventCard.getByText("Bring water bottle.").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: childName })).toBeVisible();
  });
});

async function signInWithLocalSession(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/sign-in?next=/family/setup");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Supabase is not configured yet.")).toHaveCount(0);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await expect(
    page.getByRole("button", { name: "Sign in with email" }),
  ).toBeEnabled();

  const response = await page.request.post("/api/test/session", {
    data: { email, password },
  });

  expect(response.ok()).toBe(true);
  await page.goto("/family/setup");

  if (page.url().includes("/dashboard")) {
    await expect(page.getByText("Create your family workspace")).toBeVisible();
  } else {
    await expect(page).toHaveURL(/\/(family\/setup|settings\/family)/);
  }
}
