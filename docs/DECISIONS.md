# Implementation decisions

## Phase 35: Calendar compatibility

- Keep native date/time pickers and offer explicit text entry using the same
  controlled values. This supports browsers and automation tools with different
  native-input capabilities without adding a date-picker dependency.
- Preserve entered ranges and display errors instead of silently changing the
  end. Validate calendar dates and local date/time syntax on both client and
  server. Show a summary, but do not reject valid untouched defaults: they are
  useful for events created from a selected calendar slot.
- Capture uploaded ICS bytes immediately, then use the same in-memory file for
  preview and submission. Pasted ICS becomes an in-memory file sent through the
  existing Server Action and permission checks. Neither route stores the file.
- Invalidate previews when the source changes and discard outdated asynchronous
  results. Keep the existing byte/event limits and UID duplicate handling.
- Use `/tmp/family-app-phase-35-calendar-compatibility` for the isolated worktree
  because `/tmp` is writable in this session. Base: approved local `main` at
  `26cf12a`. No dependency or platform configuration changes are needed.

## Phase 36: School event indicators

- Only `eventType === "school"` receives the school-building icon and **At
  school** badge. Titles, locations, attendee ages, and times do not infer the
  classification. No School and extracurricular events keep their categories.
- Render the indicator in the title row of timed/all-day calendar cards and
  mobile agenda cards, plus event details. Member and event colors are unchanged.
- Desktop cards use a named CSS container: below eight rem of available card
  width, the icon remains visible and the text becomes screen-reader-only.
  Wider cards, mobile agenda cards, and details show the full label. Event
  buttons include **At school** in their accessible names in either case.
- Short timed cards use tighter vertical padding and top alignment so the icon
  is not clipped. The event still opens to show the full title, time and details.
- Reuse the installed Lucide School icon and Tailwind container queries; no new
  packages, schema, permissions, environment settings or paid services.
- Reviewed installed Next.js 16.3.3 Server/Client Component guidance and the
  official [Lucide React](https://lucide.dev/guide/react) and
  [Tailwind container-query](https://tailwindcss.com/docs/responsive-design#container-queries)
  documentation before implementation.
