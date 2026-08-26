# ICS Calendar Import

Phase 20 adds a preview-first iCalendar (`.ics`) import to the family schedule.
The selected file is parsed in the browser for feedback, then uploaded to a
Server Action and parsed again before any database write. The original file is
never stored in Supabase Storage or on Vercel.

Phase 22 displays the preview and saved calendar in the importing browser's
IANA time zone while continuing to store UTC instants. This keeps previewed and
saved wall-clock times aligned even when the server runs in UTC.

## Limits

- `.ics` filename and a recognized calendar/plain-text MIME type
- 512 KB per file
- 500 `VEVENT` components per preview
- 100 selected events per import
- title: 140 characters; notes: 500; location: 160; UID: 500

Long titles, notes, and locations are truncated with a preview warning. A UID
over the limit makes that event unsupported because changing a UID would break
duplicate detection.

## Supported Events

- timed and all-day `VEVENT` entries
- UTC times
- floating times, interpreted in the importing browser's IANA time zone
- valid IANA `TZID` values
- `DTEND` or positive `DURATION`
- daily, weekly, yearly, and custom-weekday recurrence
- recurrence `INTERVAL`, `COUNT`, `UNTIL`, and non-ordinal weekly `BYDAY`
- folded lines and escaped iCalendar text handled by `ical.js`

A missing timed end defaults to one hour. A missing all-day end defaults to the
next local midnight, including 23- or 25-hour daylight-saving days.

## Reported But Not Imported

- missing UID or DTSTART
- cancelled events
- monthly and other unsupported frequencies
- ordinal or complex recurrence parts
- multiple RRULE values
- `EXDATE`, `RDATE`, `EXRULE`, and `RECURRENCE-ID`
- proprietary/non-IANA time zone identifiers
- inconsistent DTSTART/DTEND types or invalid/non-positive duration

Unsupported events remain visible in the preview with a reason and do not
prevent supported events from being selected.

## Assignment And Permissions

- Parents can import to one or more active family members or to the whole
  family.
- Caregivers and children can import only to their own calendar.
- Existing parent-only event deletion remains unchanged.
- The Server Action resolves the actor and validates attendees again; browser
  fields are not trusted.
- The database function writes each event, attendee set, and recurrence row in
  one transaction under the existing RLS policies.

## Duplicates

Imported events store their original UID on `schedule_events`. A partial unique
index on `(family_id, import_uid)` makes repeat imports idempotent. The preview
marks UIDs already stored for that family, and the database constraint handles
concurrent imports safely. Existing events are skipped rather than overwritten.

ICS export, one-occurrence series edits, exception dates, and replacing an
already imported event are outside Phase 20.
