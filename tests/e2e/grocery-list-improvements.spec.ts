import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createConfirmedParentUser } from "./supabase-local";

test("multiple grocery lists, saved-item modal, mobile rows and downloads", async ({
  page,
}, testInfo) => {
  test.slow();
  const runId = Date.now();
  const email = `groceries-${runId}@example.com`;
  const password = "FamilyTest123!";
  await createConfirmedParentUser({ email, password });
  expect(
    (
      await page.request.post("/api/test/session", {
        data: { email, password },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/family/setup");
  await page.getByLabel("Family name").fill(`Grocery family ${runId}`);
  await page.getByLabel("Your display name").fill("Parent");
  await page.getByRole("button", { name: "Create family" }).click();
  await expect(
    page.getByRole("heading", { name: `Grocery family ${runId}` }),
  ).toBeVisible();
  await page.goto("/groceries");
  await page.getByLabel(/List name/).fill("Weekly shop");
  await page.getByRole("button", { name: "Start list" }).click();
  await expect(
    page.getByRole("heading", { name: "Weekly shop" }),
  ).toBeVisible();

  const addButton = page.getByRole("button", { name: "Add item", exact: true });
  const dialog = page.getByRole("dialog", { name: "Add item", exact: true });
  await addButton.click();
  const input = dialog.getByRole("combobox", { name: "Item", exact: true });
  await expect(input).toBeFocused();
  await input.fill("Oat milk");
  await input.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("listbox")).toHaveCount(0);
  await dialog.getByLabel("Quantity").fill("2");
  await dialog.getByLabel("Unit").selectOption("L");
  await dialog.getByLabel("Category").selectOption("Dairy");
  await dialog.getByLabel("Note (optional)").fill('Unsweetened, "large"');
  await dialog.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const milk = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Oat milk", exact: true }),
  });
  await expect(milk).toContainText("2 L");
  await expect(addButton).toBeFocused();

  await page.getByRole("button", { name: "New list" }).click();
  const newList = page.getByRole("dialog", { name: "New grocery list" });
  await newList.getByLabel(/List name/).fill("Weekend shop");
  await newList.getByRole("button", { name: "Start list" }).click();
  await expect(newList).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Weekend shop" }),
  ).toBeVisible();
  await expect(milk).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Open lists" }).locator("option"),
  ).toHaveCount(2);
  await addButton.click();
  await input.fill("oat");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("Oat milk");
  await expect(dialog.getByLabel("Quantity")).toHaveValue("2");
  await expect(dialog.getByLabel("Unit")).toHaveValue("L");
  await dialog.getByLabel("Quantity").fill("1");
  await dialog.getByLabel("Category").selectOption("");
  await dialog.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(milk).toContainText("1 L");
  await expect(milk).not.toContainText("Dairy");

  await addButton.click();
  await input.fill("oat");
  await expect(
    dialog.getByRole("option", { name: /Oat milk/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await input.fill("Oat milk");
  await input.press("Escape");
  await dialog.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(dialog).toContainText("Oat milk is already on this list.");
  await expect(input).toHaveValue("Oat milk");
  await input.focus();
  await input.press("Escape");
  await input.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(addButton).toBeFocused();

  await page.screenshot({
    path: testInfo.outputPath("groceries-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const bought = milk.getByRole("button", { name: "Bought", exact: true });
  const remove = milk.getByRole("button", { name: "Remove", exact: true });
  await expect(bought.locator("span")).not.toBeVisible();
  await expect(remove.locator("span")).not.toBeVisible();
  const rowBox = await milk.boundingBox();
  const boughtBox = await bought.boundingBox();
  const removeBox = await remove.boundingBox();
  expect(boughtBox!.width).toBe(44);
  expect(removeBox!.y).toBe(boughtBox!.y);
  expect(rowBox!.height).toBeLessThan(90);
  await bought.click();
  await expect(milk.getByRole("button", { name: "Put back" })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Open lists" })
    .selectOption({ label: "Weekly shop (0/1)" });
  await expect(
    milk.getByRole("button", { name: "Bought", exact: true }),
  ).toBeVisible();
  await expect(milk).toContainText("2 L");

  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("Weekly-shop.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain(
    '"Weekly shop","Oat milk","2","L","Dairy","Unsweetened, ""large""","No"',
  );
  expect(csv).not.toContain("Weekend shop");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("groceries-mobile.png"),
    fullPage: true,
  });
  await addButton.click();
  await input.fill("oat");
  await page.screenshot({
    path: testInfo.outputPath("groceries-add-modal.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Close add item" }).click();

  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Weekend shop" }),
  ).toBeVisible();
  const history = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Weekly shop", exact: true }),
  });
  await expect(
    history.getByRole("button", { name: "Download CSV" }),
  ).toBeVisible();
  await history.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Open lists" }).locator("option"),
  ).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Open lists" })
    .selectOption({ label: "Weekly shop (0/1)" });
  await milk.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(milk).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Open lists" })
    .selectOption({ label: "Weekend shop (1/1)" });
  await expect(milk).toBeVisible();
  await milk.getByRole("button", { name: "Put back", exact: true }).click();
  await expect(
    milk.getByRole("button", { name: "Bought", exact: true }),
  ).toBeVisible();
});
