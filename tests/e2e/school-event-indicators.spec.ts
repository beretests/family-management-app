import { expect, test, type Locator } from "@playwright/test";
import { createConfirmedParentUser } from "./supabase-local";

test("identifies School events in compact, all-day, mobile and detail views", async ({
  page,
}, testInfo) => {
  test.slow();
  const runId = Date.now();
  const email = `school-badge-${runId}@example.com`;
  const password = "FamilyTest123!";
  await createConfirmedParentUser({ email, password });
  const response = await page.request.post("/api/test/session", {
    data: { email, password },
  });
  expect(response.ok()).toBe(true);
  await page.goto("/family/setup");
  await page.getByLabel("Family name").fill(`School badge family ${runId}`);
  await page.getByLabel("Your display name").fill("Parent");
  await page.getByRole("button", { name: "Create family" }).click();
  await expect(
    page.getByRole("heading", { name: `School badge family ${runId}` }),
  ).toBeVisible();
  await page.goto(
    "/schedule?date=2026-09-17&view=day&timeZone=America%2FRegina",
  );

  const fixtures = [
    { title: "Morning assembly", type: "school", allDay: false },
    { title: "School celebration", type: "school", allDay: true },
    { title: "School gym club", type: "extracurricular", allDay: false },
    { title: "Teacher planning day", type: "no_school", allDay: true },
  ];
  for (const fixture of fixtures) {
    await page.getByRole("button", { name: "Add event", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add schedule item" });
    await dialog.getByLabel("Title", { exact: true }).fill(fixture.title);
    await dialog.getByLabel("Type").selectOption(fixture.type);
    await dialog.getByLabel("Enter dates and times as text").check();
    if (fixture.allDay) {
      if (fixture.type !== "no_school")
        await dialog.getByLabel("All day", { exact: true }).check();
      await dialog.getByLabel("First day").fill("2026-09-17");
      await dialog.getByLabel("Last day").fill("2026-09-17");
    } else {
      await dialog
        .getByLabel("Starts", { exact: true })
        .fill("2026-09-17T09:00");
      await dialog.getByLabel("Ends", { exact: true }).fill("2026-09-17T09:15");
    }
    await dialog.getByLabel("Location").fill("School gym");
    await dialog.getByLabel("Notes").fill("Bring your water bottle.");
    await dialog
      .getByRole("button", { name: "Add event", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  const grid = page.getByTestId("schedule-time-grid");
  const assembly = grid.getByRole("button", { name: /^Morning assembly,/ });
  const celebration = grid.getByRole("button", {
    name: /^School celebration,/,
  });
  const club = grid.getByRole("button", { name: /^School gym club,/ });
  const noSchool = grid.getByRole("button", { name: /^Teacher planning day,/ });
  for (const card of [assembly, celebration]) {
    await expect(card).toHaveAccessibleName(/At school/);
    await expect(card.getByText("At school", { exact: true })).toBeVisible();
    await expectIconInsideCard(card);
  }
  for (const card of [club, noSchool]) {
    await expect(card.getByTitle("At school", { exact: true })).toHaveCount(0);
    await expect(card).not.toHaveAccessibleName(/At school/);
  }
  // The badge does not replace the whole-family or assigned member colour.
  expect(await assembly.evaluate((element) => element.style.boxShadow)).toBe(
    await club.evaluate((element) => element.style.boxShadow),
  );
  await page.screenshot({
    path: testInfo.outputPath("school-day.png"),
    fullPage: true,
  });

  await page.goto(
    "/schedule?date=2026-09-17&view=week&timeZone=America%2FRegina",
  );
  await expect(assembly).toBeVisible();
  await expectIconInsideCard(assembly);
  const compactLabel = assembly.getByText("At school", { exact: true });
  await expect(compactLabel).toHaveCSS("position", "absolute");
  await assembly.click();
  const details = page.getByRole("dialog", { name: "Morning assembly" });
  await expect(details.getByText("At school", { exact: true })).toBeVisible();
  await expect(details.getByText("School gym", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close event details" }).click();
  await page.screenshot({
    path: testInfo.outputPath("school-week.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  const agenda = page.getByTestId("schedule-mobile-agenda");
  const mobileAssembly = agenda.getByRole("button", {
    name: /^Morning assembly,/,
  });
  await expect(
    mobileAssembly.getByText("At school", { exact: true }),
  ).toBeVisible();
  await expect(mobileAssembly).toHaveAccessibleName(/At school/);
  await mobileAssembly.click();
  await expect(details.getByText("At school", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close event details" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await mobileAssembly.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("school-mobile.png") });
});

async function expectIconInsideCard(card: Locator) {
  const icon = card.getByTitle("At school", { exact: true }).locator("svg");
  await expect(icon).toBeVisible();
  const bounds = await card.boundingBox();
  const iconBounds = await icon.boundingBox();
  expect(bounds).not.toBeNull();
  expect(iconBounds).not.toBeNull();
  expect(iconBounds!.y).toBeGreaterThanOrEqual(bounds!.y);
  expect(iconBounds!.y + iconBounds!.height).toBeLessThanOrEqual(
    bounds!.y + bounds!.height,
  );
  expect(iconBounds!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(iconBounds!.x + iconBounds!.width).toBeLessThanOrEqual(
    bounds!.x + bounds!.width,
  );
}
