import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IcsImportForm } from "@/components/schedule/ics-import-form";
import { MAX_ICS_FILE_BYTES } from "@/features/schedule/ics/parser";

const mocks = vi.hoisted(() => ({ duplicates: vi.fn(), import: vi.fn() }));
vi.mock("@/features/schedule/ics/actions", () => ({
  findDuplicateIcsUids: mocks.duplicates,
  importIcsEvents: mocks.import,
}));

const calendar = (title = "Soccer") =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${title}@test`,
    "DTSTART:20260922T220000Z",
    "DTEND:20260922T230000Z",
    `SUMMARY:${title}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

function renderImport() {
  render(
    <IcsImportForm
      actorMemberId="33333333-3333-4333-8333-333333333333"
      canManageAll={false}
      familyId="22222222-2222-4222-8222-222222222222"
      members={[]}
    />,
  );
}
function paste(text: string) {
  fireEvent.change(screen.getByLabelText("Calendar source"), {
    target: { value: "text" },
  });
  fireEvent.change(screen.getByLabelText("Calendar text"), {
    target: { value: text },
  });
}
function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("iCalendar file"), {
    target: { files: [file] },
  });
}
function fileWithRead(read: () => Promise<ArrayBuffer>) {
  const file = new File([calendar()], "soccer.ics", { type: "text/calendar" });
  Object.defineProperty(file, "arrayBuffer", { value: read });
  return file;
}
function readText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(file);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.duplicates.mockResolvedValue([]);
  mocks.import.mockResolvedValue({ error: "Retry import" });
});

describe("calendar import sources", () => {
  it("captures the file once and submits the previewed bytes even if the original becomes unreadable", async () => {
    renderImport();
    const read = vi
      .fn()
      .mockResolvedValue(new TextEncoder().encode(calendar()).buffer);
    selectFile(fileWithRead(read));
    await screen.findByText("Ready to preview: soccer.ics");
    read.mockRejectedValue(new DOMException("Gone", "NotFoundError"));
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    await screen.findByText("1 ready");
    fireEvent.click(screen.getByRole("button", { name: "Import 1 event" }));
    await waitFor(() => expect(mocks.import).toHaveBeenCalledOnce());
    const data = mocks.import.mock.calls[0][1] as FormData;
    expect(await readText(data.get("calendarFile") as File)).toBe(calendar());
    expect(data.getAll("selectedUids")).toEqual(["Soccer@test"]);
    expect(read).toHaveBeenCalledOnce();
  });

  it("explains unreadable files, blocks importing and supports paste recovery", async () => {
    renderImport();
    selectFile(
      fileWithRead(() =>
        Promise.reject(new DOMException("Gone", "NotFoundError")),
      ),
    );
    await screen.findByText(/This file could not be read/);
    expect(
      screen.getByRole("button", { name: "Preview events" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Import selected events" }),
    ).toBeDisabled();
    paste(calendar());
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    await screen.findByText("1 ready");
    fireEvent.click(screen.getByRole("button", { name: "Import 1 event" }));
    await waitFor(() => expect(mocks.import).toHaveBeenCalledOnce());
    expect(
      await readText(mocks.import.mock.calls[0][1].get("calendarFile")),
    ).toBe(calendar().replaceAll("\r\n", "\n"));
  });

  it("ignores an old preview after the source changes", async () => {
    let resolve!: (uids: string[]) => void;
    mocks.duplicates.mockReturnValueOnce(
      new Promise<string[]>((done) => {
        resolve = done;
      }),
    );
    renderImport();
    paste(calendar("Old"));
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    fireEvent.change(screen.getByLabelText("Calendar text"), {
      target: { value: calendar("New") },
    });
    await act(async () => {
      resolve([]);
    });
    expect(screen.queryByText("Old")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import selected events" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    await screen.findByText("New");
    expect(
      screen.getByRole("button", { name: "Import 1 event" }),
    ).toBeEnabled();
  });

  it("ignores an old file read after switching to pasted content", async () => {
    let resolve!: (bytes: ArrayBuffer) => void;
    renderImport();
    selectFile(
      fileWithRead(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
    );
    paste(calendar("New"));
    await act(async () => {
      resolve(new TextEncoder().encode(calendar("Old")).buffer);
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    await screen.findByText("New");
    expect(screen.queryByText("Old")).not.toBeInTheDocument();
  });

  it("invalidates an existing preview when content changes and enforces the byte limit", async () => {
    renderImport();
    paste(calendar());
    fireEvent.click(screen.getByRole("button", { name: "Preview events" }));
    await screen.findByText("1 ready");
    fireEvent.change(screen.getByLabelText("Calendar text"), {
      target: { value: "é".repeat(MAX_ICS_FILE_BYTES / 2 + 1) },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("512 KB");
    expect(screen.queryByText("1 ready")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import selected events" }),
    ).toBeDisabled();
    expect(mocks.import).not.toHaveBeenCalled();
  });
});
