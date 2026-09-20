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

## Phase 37: Multiple Grocery Lists and Compact Shopping UI

- Allow multiple open lists by replacing the unique partial index with a
  non-unique family/creation-time/ID index. Preserve list-specific catalog
  uniqueness, existing actor checks, RLS, and 90-day closed-list retention.
- Keep a selected open list in client state, defaulting to the newest available
  list; select newly created lists and fall back when a list closes. Lists do
  not share quantities, notes, or bought state.
- Reuse the native-dialog Modal for Add item. The editable item combobox searches
  saved names/categories, supports Arrow keys/Enter/Escape, and prevents choosing
  already-added items. First Escape dismisses suggestions; second closes the
  modal. Saved defaults can be edited or cleared for the current list.
- Use compact icon buttons on mobile with 44px touch targets and accessible names;
  keep visible labels on larger screens.
- Download CSV in the browser using already-authorized data, including recent
  closed lists. Quote/escape fields, neutralize spreadsheet formula prefixes,
  include a UTF-8 BOM, and use safe filenames. No new endpoint, package, or
  storage is needed. Paginate reads so row limits do not silently truncate lists.
- No new paid services or environment variables. More lists/items consume the
  existing database and egress quota; closed-list retention is unchanged.
- Reviewed installed Next.js 16.3.3 server/client and mutation guides and current
  [Next.js mutation docs](https://nextjs.org/docs/app/getting-started/mutating-data)
  and [Supabase index docs](https://supabase.com/docs/guides/database/postgres/indexes).
