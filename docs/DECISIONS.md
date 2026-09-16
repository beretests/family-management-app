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
