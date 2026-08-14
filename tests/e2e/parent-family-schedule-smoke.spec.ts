import { expect, test, type Page } from "@playwright/test";
import { createConfirmedParentUser } from "./supabase-local";

test.describe("parent family setup smoke flow", () => {
  test("creates family, schedule, chore templates, assignments, and my today tasks", async ({
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
    const importedEventTitle = `Imported dance ${runId}`;
    const calendarFile = {
      name: `family-${runId}.ics`,
      mimeType: "text/calendar",
      buffer: Buffer.from(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Family App//E2E//EN",
          "BEGIN:VEVENT",
          `UID:import-${runId}@example.test`,
          "DTSTART;TZID=America/Regina:20260720T180000",
          "DTEND;TZID=America/Regina:20260720T190000",
          "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=3",
          `SUMMARY:${importedEventTitle}`,
          "LOCATION:Dance studio",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
      ),
    };

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
    await childForm.getByLabel("Birth month and year").fill("2018-07");
    await childForm.getByLabel("Ability level").selectOption("3");
    await childForm
      .getByLabel("Preferences, dislikes, and safety notes")
      .fill("Dislikes cleaning bathrooms.");
    await childForm.getByRole("button", { name: "Add child" }).click();

    const childCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(childCard).toBeVisible();
    await expect(
      childCard.getByText("Dislikes cleaning bathrooms.").first(),
    ).toBeVisible();

    await page.goto("/schedule?date=2026-07-12&view=day");
    await expect(
      page.getByRole("heading", { name: /Daily Calendar$/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Sunday, July 12", { exact: false }),
    ).toBeVisible();

    await page.getByText("Add schedule item", { exact: true }).click();
    const scheduleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Add event" }),
    });
    await scheduleForm.getByLabel("Title").fill(eventTitle);
    await scheduleForm.getByLabel("Type").selectOption("extracurricular");
    await scheduleForm.getByLabel("Starts").fill("2026-07-12T16:00");
    await scheduleForm.getByLabel("Ends").fill("2026-07-12T17:00");
    await scheduleForm.getByLabel("Whole family").uncheck();
    await scheduleForm.getByLabel(childName).check();
    await scheduleForm.getByLabel("Location").fill("Community field");
    await scheduleForm.getByLabel("Notes").fill("Bring water bottle.");
    await scheduleForm.getByLabel("Repeats").selectOption("daily");
    await scheduleForm.getByLabel("Series ends").selectOption("after");
    await scheduleForm.getByLabel("Number of occurrences").fill("10");
    await scheduleForm.getByRole("button", { name: "Add event" }).click();

    const eventCard = page
      .getByRole("heading", { name: eventTitle })
      .locator("xpath=ancestor::article[1]");
    await expect(eventCard).toBeVisible();
    await expect(eventCard.getByText("Community field").first()).toBeVisible();
    await expect(
      eventCard.getByText("Bring water bottle.").first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: childName })).toBeVisible();

    await page.goto("/schedule?date=2026-07-19&view=day");
    await expect(page.getByText(eventTitle).first()).toBeVisible();
    await expect(page.getByText("Repeats daily")).toBeVisible();

    await page.goto("/schedule?date=2026-07-25&view=day");
    await expect(page.getByText(eventTitle)).toHaveCount(0);

    await page.getByText("Import calendar file", { exact: true }).click();
    const importForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Preview events" }),
    });
    await importForm.getByLabel("iCalendar file").setInputFiles(calendarFile);
    await importForm.getByRole("button", { name: "Preview events" }).click();
    await expect(importForm.getByText("1 ready")).toBeVisible();
    await expect(importForm.getByText(importedEventTitle)).toBeVisible();
    await importForm.getByLabel(parentName).uncheck();
    await importForm.getByLabel(childName).check();
    await importForm.getByRole("button", { name: "Import 1 event" }).click();
    await expect(importForm.getByText("1 imported.")).toBeVisible();

    await page.goto("/schedule?date=2026-07-20&view=day");
    await expect(page.getByText(importedEventTitle).first()).toBeVisible();
    await expect(page.getByText("Repeats weekly")).toBeVisible();

    await page.goto("/schedule?date=2026-07-22&view=day");
    await expect(page.getByText(importedEventTitle).first()).toBeVisible();

    await page.getByText("Import calendar file", { exact: true }).click();
    const duplicateImportForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Preview events" }),
    });
    await duplicateImportForm
      .getByLabel("iCalendar file")
      .setInputFiles(calendarFile);
    await duplicateImportForm
      .getByRole("button", { name: "Preview events" })
      .click();
    await expect(duplicateImportForm.getByText("1 duplicates")).toBeVisible();
    await expect(
      duplicateImportForm.getByText("This event was already imported."),
    ).toBeVisible();

    await page.goto("/chores");
    await expect(
      page.getByRole("heading", { name: "Build the family chore library" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Generate chore templates" })
      .click();
    const familyTemplates = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Family templates" }),
    });
    await expect(
      familyTemplates.getByRole("heading", { name: "Wash Dishes" }),
    ).toBeVisible();
    await expect(
      familyTemplates.getByRole("heading", { name: "Sweep Kitchen" }),
    ).toBeVisible();

    await page.goto("/assignments");
    await expect(
      page.getByRole("heading", { name: "Plan daily chores" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create assignments" }).click();
    await expect(page.getByText("Assignments created.")).toBeVisible();

    await page.goto("/my-today");
    await expect(page.getByText("Family view", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sweep Kitchen" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Children update and submit chores from their own profiles.")
        .first(),
    ).toBeVisible();
  });
});

async function signInWithLocalSession(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/sign-in?next=/family/setup");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Supabase is not configured yet.")).toHaveCount(
    0,
  );

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
