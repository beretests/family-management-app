import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GroceryListManager } from "@/components/groceries/grocery-list-manager";
import type {
  GroceryCatalogItem,
  GroceryList,
} from "@/features/groceries/types";

const familyId = "24444444-4444-4444-8444-444444444444";
const catalogItem: GroceryCatalogItem = {
  active: true,
  category: "Dairy",
  createdAt: "2026-08-28T12:00:00.000Z",
  createdByMemberId: null,
  defaultQuantity: 2,
  defaultUnit: "L",
  familyId,
  id: "24777777-7777-4777-8777-777777777777",
  name: "Milk",
  normalizedName: "milk",
  updatedAt: "2026-08-28T12:00:00.000Z",
};

afterEach(cleanup);

describe("GroceryListManager", () => {
  it("starts a new list with reusable catalog choices", () => {
    render(
      <GroceryListManager
        catalog={[catalogItem]}
        familyId={familyId}
        history={[]}
        isParent={false}
        items={[]}
        members={[]}
        openList={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Start a grocery list" }),
    ).toBeVisible();
    expect(screen.getByLabelText(/^Milk/)).toHaveAttribute(
      "name",
      "catalogItemIds",
    );
    expect(screen.getByRole("button", { name: "Start list" })).toBeVisible();
  });

  it("shows an open list, quick add, catalog reuse, and parent lifecycle controls", () => {
    const openList: GroceryList = {
      checkedItemCount: 0,
      closedAt: null,
      closedByMemberId: null,
      createdAt: "2026-08-28T12:00:00.000Z",
      createdByMemberId: null,
      deleteAfter: null,
      familyId,
      id: "24888888-8888-4888-8888-888888888888",
      itemCount: 0,
      name: "Weekly groceries",
      status: "open",
      updatedAt: "2026-08-28T12:00:00.000Z",
    };

    render(
      <GroceryListManager
        catalog={[catalogItem]}
        familyId={familyId}
        history={[]}
        isParent
        items={[]}
        members={[]}
        openList={openList}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Weekly groceries" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Add something low" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /Milk/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "Complete" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
  });

  it("confirms permanent list deletion without a browser dialog", () => {
    const completedList: GroceryList = {
      checkedItemCount: 1,
      closedAt: "2026-08-29T12:00:00.000Z",
      closedByMemberId: null,
      createdAt: "2026-08-28T12:00:00.000Z",
      createdByMemberId: null,
      deleteAfter: "2026-11-27T12:00:00.000Z",
      familyId,
      id: "24888888-8888-4888-8888-888888888888",
      itemCount: 1,
      name: "Weekly groceries",
      status: "completed",
      updatedAt: "2026-08-29T12:00:00.000Z",
    };

    render(
      <GroceryListManager
        catalog={[]}
        familyId={familyId}
        history={[completedList]}
        isParent
        items={[]}
        members={[]}
        openList={null}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    const confirmation = screen.getByRole("group", {
      name: "Permanently delete this list?",
    });
    expect(confirmation).toHaveTextContent(
      "“Weekly groceries” and its items will be permanently deleted. This cannot be undone.",
    );
    expect(
      within(confirmation).getByRole("button", {
        name: "Delete permanently",
      }),
    ).toHaveAttribute("value", "delete");

    const keepButton = within(confirmation).getByRole("button", {
      name: "Keep list",
    });
    expect(keepButton).toHaveFocus();
    fireEvent.click(keepButton);

    expect(
      screen.queryByRole("group", { name: "Permanently delete this list?" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });
});
