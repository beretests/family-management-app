# Calendar date and time entry

The schedule form supports native date pickers and **Type dates and times as
text**. Both modes use the same values. Text dates use `YYYY-MM-DD`; timed
values use `YYYY-MM-DDTHH:mm` in 24-hour time (seconds are also accepted).
Use the calendar time zone shown above the form, without a UTC `Z` or offset.
The server still converts valid local values to stored UTC instants.

Start/end, all-day first/last day, and recurrence end date all support text
entry. Invalid dates and reversed ranges show errors. Editing the start no
longer changes the end, and an end before the start is no longer replaced with
start plus one hour. Correct the range explicitly before saving. A summary
shows the current dates, times and time zone. The all-day last day is inclusive;
storage continues to use the following midnight as its exclusive end.

Automation should fill the labeled controls, finish all other fields, and
assert both date/time values immediately before saving. Reopen the saved event
and verify its start, end and recurrence. Valid defaults remain valid: the app
cannot infer an automation tool's intended date when that tool never updates
the controls. Use the text-entry option if the tool cannot operate native inputs.

No database migration, Supabase/Vercel dashboard change, new environment
variable, paid service, or additional persistent storage is required.

References checked for this change:

- [Next.js forms](https://nextjs.org/docs/app/guides/forms), plus installed Next.js 16.3.3 forms guidance.
- [React controlled inputs](https://react.dev/reference/react-dom/components/input).
- [Playwright date input and file upload](https://playwright.dev/docs/input).

## School events

Events categorized as **School** display a school-building icon and **At school**
badge in the day/week calendar, mobile agenda, all-day row, and event details.
Each child's existing color continues to identify who is attending. On narrow
or overlapping desktop cards the icon remains visible; opening the event shows
the full label. Screen readers receive the label even on compact cards.

The badge reflects only the event's **Type**. **No School**, extracurricular,
and other categories do not receive it, even when their title or location
mentions a school. Existing School events gain the indicator automatically.
