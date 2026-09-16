import { MAX_ICS_FILE_BYTES } from "./parser";

const acceptedCalendarTypes = new Set([
  "",
  "application/ics",
  "application/octet-stream",
  "text/calendar",
  "text/plain",
]);

export function validateCalendarFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) {
    return "Choose an .ics calendar file.";
  }

  if (!value.name.toLowerCase().endsWith(".ics")) {
    return "Choose a file whose name ends in .ics.";
  }

  if (!acceptedCalendarTypes.has(value.type.toLowerCase())) {
    return "Choose an iCalendar (.ics) file.";
  }

  if (value.size === 0) {
    return "The calendar file is empty.";
  }

  if (value.size > MAX_ICS_FILE_BYTES) {
    return "Calendar files must be 512 KB or smaller.";
  }

  return null;
}

export type IcsSource = { file: File; text: string };

export async function readIcsSource(file: File): Promise<IcsSource> {
  const error = validateCalendarFile(file);
  if (error) throw new Error(error);
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new Error(
      "This file could not be read. Choose it again, or paste its calendar text below.",
    );
  }
  return {
    file: new File([bytes], file.name, { type: file.type }),
    text: new TextDecoder().decode(bytes),
  };
}

export function pastedIcsSource(text: string): IcsSource {
  const file = new File([text], "pasted-calendar.ics", {
    type: "text/calendar",
  });
  const error = validateCalendarFile(file);
  if (error) throw new Error(error);
  return { file, text };
}
