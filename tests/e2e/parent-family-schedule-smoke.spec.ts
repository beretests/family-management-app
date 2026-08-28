import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createConfirmedParentUser,
  getLocalAuthEmailLink,
} from "./supabase-local";

test.describe("parent family setup smoke flow", () => {
  test("connects and disconnects an existing child profile by email", async ({
    page,
  }) => {
    test.slow();
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const parentEmail = `invite-parent-${runId}@example.com`;
    const childEmail = `invited-child-${runId}@example.com`;
    const parentPassword = "FamilyTest123!";
    const childPassword = "ChildFamily123!";
    const familyName = `Invite Family ${runId}`;
    const childName = `Connected Kid ${runId}`;

    await createConfirmedParentUser({
      email: parentEmail,
      password: parentPassword,
    });
    await signInWithLocalSession(page, parentEmail, parentPassword);
    await page.goto("/family/setup");
    await page.getByLabel("Family name").fill(familyName);
    await page.getByLabel("Your display name").fill(`Parent ${runId}`);
    await page.getByRole("button", { name: "Create family" }).click();

    await page.getByRole("button", { name: "Add child" }).click();
    const childDialog = page.getByRole("dialog", { name: "Add a child" });
    await childDialog.getByLabel("Name").fill(childName);
    await childDialog.getByLabel("Birth month and year").fill("2014-03");
    await childDialog.getByLabel("Ability level").selectOption("4");
    await childDialog
      .getByRole("button", { name: "Add child", exact: true })
      .click();
    await expect(childDialog).toHaveCount(0);

    let childCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(childCard.getByText("No email account")).toBeVisible();
    await childCard.getByRole("button", { name: "Connect email" }).click();
    const emailDialog = page.getByRole("dialog", {
      name: `Connect email for ${childName}`,
    });
    await emailDialog
      .getByRole("textbox", { name: "Child email", exact: true })
      .fill(childEmail);
    await emailDialog.getByLabel(/I am the parent or guardian/).check();
    await emailDialog
      .getByRole("button", { name: "Send child invite" })
      .click();
    await expect(emailDialog).toHaveCount(0);
    await expect(childCard.getByText("Email invite pending")).toBeVisible();

    const invitationLink = await getLocalAuthEmailLink({
      email: childEmail,
      pathIncludes: "/family/child-invite/accept",
    });
    await page.goto(invitationLink);
    await expect(page).toHaveURL(/\/family\/child-invite\/accept/);
    await page.getByLabel("Create password").fill(childPassword);
    await page.getByLabel("Confirm password").fill(childPassword);
    await page.getByRole("button", { name: "Connect to family" }).click();

    await expect(page).toHaveURL(/\/schedule/);
    await expect(
      page.getByRole("link", { name: "Family", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText(`Child account: ${childName}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exit Kid Mode" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Sign out" }).click();
    await signInWithLocalSession(page, parentEmail, parentPassword);
    await expect(page).toHaveURL(/\/settings\/family/);
    childCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(childCard.getByText("Email connected")).toBeVisible();
    await childCard.getByRole("button", { name: "Disconnect email" }).click();
    await expect(childCard.getByText("No email account")).toBeVisible();
    await expect(page.getByRole("heading", { name: childName })).toBeVisible();
  });

  test("creates family, schedule, chore templates, assignments, and my today tasks", async ({
    page,
  }) => {
    test.slow();
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `parent-${runId}@example.com`;
    const password = "FamilyTest123!";
    const familyName = `E2E Family ${runId}`;
    const parentName = `Parent ${runId}`;
    const childName = `Ari ${runId}`;
    const eventTitle = `Soccer practice ${runId}`;
    const noSchoolTitle = `No School ${runId}`;
    const importedEventTitle = `Imported dance ${runId}`;
    const groceryItemTitle = `Milk ${runId}`;
    const removableGroceryItemTitle = `Bread ${runId}`;
    const groceryListName = `Weekly groceries ${runId}`;
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
    await expectNoPageOverflow(page);

    await page.getByLabel("Family name").fill(familyName);
    await page.getByLabel("Your display name").fill(parentName);
    await page.getByRole("button", { name: "Create family" }).click();

    await expect(page).toHaveURL(/\/settings\/family/);
    await expect(page.getByRole("heading", { name: familyName })).toBeVisible();
    await expectNoPageOverflow(page);

    const mobileMenuButton = page.getByRole("button", { name: "Menu" });
    await expect(mobileMenuButton).toBeVisible();
    await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("link", { name: "Schedule", exact: true }),
    ).not.toBeVisible();
    await mobileMenuButton.click();
    await expect(
      page.getByRole("link", { name: "Schedule", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");
    await expect(mobileMenuButton).toBeFocused();

    await page.getByRole("button", { name: "Add child" }).click();
    const childDialog = page.getByRole("dialog", { name: "Add a child" });
    await childDialog.getByLabel("Name").fill(childName);
    await childDialog.getByLabel("Birth month and year").fill("2018-07");
    await childDialog.getByLabel("Ability level").selectOption("3");
    await childDialog
      .getByLabel("Preferences, dislikes, and safety notes")
      .fill("Dislikes cleaning bathrooms.");
    await childDialog
      .getByRole("button", { name: "Add child", exact: true })
      .click();
    await expect(childDialog).toHaveCount(0);

    const childCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(childCard).toBeVisible();
    await expect(
      childCard.getByText("Dislikes cleaning bathrooms.").first(),
    ).toBeVisible();

    await page.goto("/groceries");
    await expect(
      page.getByRole("heading", { name: "Groceries" }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
    const startListForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Start list" }),
    });
    await startListForm.getByLabel(/List name/).fill(groceryListName);
    await startListForm.getByRole("button", { name: "Start list" }).click();
    await expect(
      page.getByRole("heading", { name: groceryListName }),
    ).toBeVisible();

    const quickAddForm = page.locator("form").filter({
      has: page.getByRole("button", { name: /Add item/ }),
    });
    await quickAddForm.getByLabel("Item").fill(groceryItemTitle);
    await quickAddForm.getByLabel("Quantity").fill("2");
    await quickAddForm.getByLabel("Unit").selectOption("L");
    await quickAddForm.getByLabel("Category").selectOption("Dairy");
    await quickAddForm.getByLabel(/Note/).fill("Unsweetened");
    await quickAddForm.getByRole("button", { name: /Add item/ }).click();
    const groceryItemCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: groceryItemTitle }),
    });
    await expect(groceryItemCard).toContainText("2 L");
    await expect(groceryItemCard).toContainText("Unsweetened");
    await quickAddForm.getByLabel("Item").fill(removableGroceryItemTitle);
    await quickAddForm.getByRole("button", { name: /Add item/ }).click();
    const removableGroceryItemCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: removableGroceryItemTitle }),
    });
    await expect(removableGroceryItemCard).toBeVisible();
    await removableGroceryItemCard
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(removableGroceryItemCard).toHaveCount(0);
    await groceryItemCard.getByRole("button", { name: "Bought" }).click();
    await expect(page.getByRole("button", { name: "Put back" })).toBeVisible();
    await page.getByRole("button", { name: "Put back" }).click();
    await expect(page.getByRole("button", { name: "Bought" })).toBeVisible();
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(
      page.getByRole("heading", { name: "Start a grocery list" }),
    ).toBeVisible();
    const completedListCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: groceryListName }),
    });
    await expect(completedListCard).toContainText("completed");
    await expect(completedListCard).toContainText("Scheduled for deletion");

    const nextListForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Start list" }),
    });
    await nextListForm.getByLabel(new RegExp(`^${groceryItemTitle}`)).check();
    await nextListForm.getByRole("button", { name: "Start list" }).click();
    await expect(
      page.getByRole("heading", { name: groceryItemTitle }),
    ).toBeVisible();
    await expectNoPageOverflow(page);

    await page.goto("/schedule?date=2026-07-12&view=day");
    await expect(
      page.getByRole("heading", { name: /Daily Calendar$/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Sunday, July 12", { exact: false }),
    ).toBeVisible();

    const addEventButton = page.getByRole("button", { name: "Add event" });
    const importCalendarButton = page.getByRole("button", {
      name: "Import calendar",
    });
    const calendarViewLinks = await page
      .getByRole("navigation", { name: "Calendar view" })
      .getByRole("link")
      .all();
    const calendarRegion = page.getByRole("region", { name: "Daily calendar" });
    await expect(addEventButton).toBeVisible();
    await expectVerticallyStacked([addEventButton, importCalendarButton]);
    await expectVerticallyStacked(calendarViewLinks);
    await expectButtonBeforeRegion(addEventButton, calendarRegion);
    await addEventButton.click();
    const addDialog = page.getByRole("dialog", { name: "Add schedule item" });
    await expect(addDialog).toBeVisible();
    await expectDialogFitsViewport(page, addDialog);
    const scheduleForm = addDialog.locator("form");
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
    await expect(addDialog).toHaveCount(0);
    await expect(page.getByText("Schedule event added.")).toBeVisible();

    await expect(eventButton(page, eventTitle)).toBeVisible();
    await expectNoPageOverflow(page);
    await eventButton(page, eventTitle).click();
    expect(browserErrors).toEqual([]);
    const eventDialog = page.getByRole("dialog", { name: eventTitle });
    await expect(eventDialog).toBeVisible();
    await expect(
      eventDialog.getByText("Community field").first(),
    ).toBeVisible();
    await expect(
      eventDialog.getByText("Bring water bottle.").first(),
    ).toBeVisible();
    await expectDialogFitsViewport(page, eventDialog);
    await eventDialog
      .getByRole("button", { name: "Close event details" })
      .click();
    await expect(eventDialog).toHaveCount(0);
    await expect(page.getByRole("link", { name: childName })).toBeVisible();

    await addEventButton.click();
    const noSchoolDialog = page.getByRole("dialog", {
      name: "Add schedule item",
    });
    const noSchoolForm = noSchoolDialog.locator("form");
    await noSchoolForm.getByLabel("Title").fill(noSchoolTitle);
    await noSchoolForm.getByLabel("Type").selectOption("no_school");
    await expect(noSchoolForm.getByLabel("All day")).toBeChecked();
    await expect(noSchoolForm.getByLabel("All day")).toBeDisabled();
    await noSchoolForm.getByLabel("First day").fill("2026-07-13");
    await noSchoolForm.getByLabel("Last day").fill("2026-07-13");
    await noSchoolForm.getByLabel("Whole family").uncheck();
    await noSchoolForm.getByLabel(childName).check();
    await noSchoolForm.getByRole("button", { name: "Add event" }).click();
    await expect(noSchoolDialog).toHaveCount(0);

    await page.goto("/schedule?date=2026-07-13&view=day");
    await expect(eventButton(page, noSchoolTitle)).toBeVisible();
    await eventButton(page, noSchoolTitle).click();
    const noSchoolDetails = page.getByRole("dialog", { name: noSchoolTitle });
    await expect(noSchoolDetails.getByText("No School").first()).toBeVisible();
    await expect(
      noSchoolDetails.getByRole("paragraph").filter({ hasText: /^All day$/ }),
    ).toBeVisible();
    await expect(noSchoolDetails.getByText("Conflict")).toHaveCount(0);
    await noSchoolDetails
      .getByRole("button", { name: "Close event details" })
      .click();

    await page.goto("/schedule?date=2026-07-12&view=week");
    await expect(
      page.getByRole("region", { name: "Weekly calendar" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("schedule-mobile-agenda").locator(":scope > section"),
    ).toHaveCount(7);
    await expectNoPageOverflow(page);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/schedule?date=2026-07-13&view=day");
    await expectHorizontallyAligned([
      page.getByRole("button", { name: "Add event" }),
      page.getByRole("button", { name: "Import calendar" }),
    ]);
    await expectHorizontallyAligned(
      await page
        .getByRole("navigation", { name: "Calendar view" })
        .getByRole("link")
        .all(),
    );
    const allDayCoverage = page.getByTestId("all-day-coverage-2026-07-13");
    await expect(allDayCoverage).toBeVisible();
    await expect
      .poll(async () => (await allDayCoverage.boundingBox())?.height ?? 0)
      .toBeGreaterThan(600);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/schedule?date=2026-07-19&view=day");
    await expect(eventButton(page, eventTitle)).toBeVisible();
    await eventButton(page, eventTitle).click();
    await expect(
      page.getByRole("dialog", { name: eventTitle }).getByText("Repeats daily"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close event details" }).click();

    await page.goto("/schedule?date=2026-07-25&view=day");
    await expect(eventButton(page, eventTitle)).toHaveCount(0);

    await page.getByRole("button", { name: "Import calendar" }).click();
    const importDialog = page.getByRole("dialog", {
      name: "Import calendar file",
    });
    const importForm = importDialog.locator("form");
    await importForm.getByLabel("iCalendar file").setInputFiles(calendarFile);
    await importForm.getByRole("button", { name: "Preview events" }).click();
    await expect(importForm.getByText("1 ready")).toBeVisible();
    await expect(importForm.getByText(importedEventTitle)).toBeVisible();
    await importForm.getByLabel(parentName).uncheck();
    await importForm.getByLabel(childName).check();
    await importForm.getByRole("button", { name: "Import 1 event" }).click();
    await expect(importDialog).toHaveCount(0);
    await expect(page.getByText("1 imported.")).toBeVisible();

    await page.goto("/schedule?date=2026-07-20&view=day");
    await expect(eventButton(page, importedEventTitle)).toBeVisible();
    await eventButton(page, importedEventTitle).click();
    await expect(
      page
        .getByRole("dialog", { name: importedEventTitle })
        .getByText("Repeats weekly"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close event details" }).click();

    await page.goto("/schedule?date=2026-07-22&view=day");
    await expect(eventButton(page, importedEventTitle)).toBeVisible();

    await page.getByRole("button", { name: "Import calendar" }).click();
    const duplicateImportForm = page
      .getByRole("dialog", { name: "Import calendar file" })
      .locator("form");
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
    await expectNoPageOverflow(page);

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
    await expectNoPageOverflow(page);
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
    await expectNoPageOverflow(page);
  });
});

async function signInWithLocalSession(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/sign-in?next=/family/setup");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expectNoPageOverflow(page);
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

function eventButton(page: Page, title: string) {
  return page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(title)},`),
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function expectNoPageOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

async function expectButtonBeforeRegion(
  button: ReturnType<Page["getByRole"]>,
  region: ReturnType<Page["getByRole"]>,
) {
  const buttonBox = await button.boundingBox();
  const regionBox = await region.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(regionBox).not.toBeNull();
  expect(buttonBox!.y + buttonBox!.height).toBeLessThan(regionBox!.y);
}

async function expectVerticallyStacked(items: Locator[]) {
  const boxes = await Promise.all(items.map((item) => item.boundingBox()));

  expect(boxes.length).toBeGreaterThan(1);
  boxes.forEach((box) => expect(box).not.toBeNull());

  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1]!;
    const current = boxes[index]!;

    expect(current.y).toBeGreaterThan(previous.y + previous.height - 1);
    expect(Math.abs(current.x - boxes[0]!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(current.width - boxes[0]!.width)).toBeLessThanOrEqual(1);
  }
}

async function expectHorizontallyAligned(items: Locator[]) {
  const boxes = await Promise.all(items.map((item) => item.boundingBox()));

  expect(boxes.length).toBeGreaterThan(1);
  boxes.forEach((box) => expect(box).not.toBeNull());

  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1]!;
    const current = boxes[index]!;

    expect(Math.abs(current.y - boxes[0]!.y)).toBeLessThanOrEqual(1);
    expect(current.x).toBeGreaterThan(previous.x + previous.width - 1);
  }
}

async function expectDialogFitsViewport(
  page: Page,
  dialog: ReturnType<Page["getByRole"]>,
) {
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.height).toBeLessThanOrEqual(viewport!.height);
}
