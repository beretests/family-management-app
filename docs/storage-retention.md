# Storage Retention

Phase 8 adds private evidence uploads for kid task submissions. Phase 11 adds
bounded automated cleanup for reviewed evidence.

## Bucket

- Bucket name: `task-evidence`
- Public access: disabled
- Max file size: 5 MB
- Allowed content types: JPEG, PNG, WebP, GIF

The bucket and Storage object policies are created by migration. Do not make the
bucket public in the Supabase dashboard.

## Access Pattern

Evidence object paths are scoped as:

```text
<family_id>/<task_instance_id>/<member_id>/<evidence_id>.<ext>
```

Assigned members can upload evidence only for their own open tasks. Parents,
caregivers, and assigned members can view private evidence through short-lived
signed URLs.

## Retention Target

The default retention target is to remove approved or rejected evidence after 30
days.

Phase 11 cleanup behavior:

- The cleanup job scans `task_evidence_files` in bounded batches.
- Evidence is eligible when `retention_delete_after` is in the past, or when the
  related task is `approved` or `rejected` and the review timestamp is older
  than 30 days.
- The job deletes the private Storage object first, then deletes the matching
  metadata row.
- Cleanup is idempotent and safe to rerun.
- Unreviewed submitted evidence is not removed by the fallback 30-day rule.

Keep evidence uploads small and avoid using evidence for long-term photo
storage.

## Grocery List Retention

Phase 24 also uses the daily maintenance route for database-only grocery list
retention:

- Completing or archiving a list sets `delete_after` to 90 days after
  `closed_at`.
- Reopening the list clears `closed_at`, `closed_by_member_id`, and
  `delete_after`.
- Open lists are never selected for automatic cleanup.
- Cleanup scans no more than 100 eligible lists per run and deletes the list;
  its list items cascade automatically.
- Cleanup rechecks status and expiry when deleting so a concurrently reopened
  list is preserved, and records a parent-visible retention audit event for
  every list actually deleted.
- `grocery_catalog_items` are deliberately preserved so the family can reuse
  them on future lists.
- A parent may permanently delete a list sooner through the app. Automatic
  deletion after the retention date is not recoverable through the app.

## Scheduled Cleanup

Phase 11 adds a secured daily maintenance route:

```text
/api/cron/daily-maintenance
```

The route requires:

```text
Authorization: Bearer <CRON_SECRET>
```

When deployed to Vercel, `vercel.json` schedules the route once daily. Vercel
Hobby cron is low-frequency and not minute-precise, so cleanup must not depend
on exact timing.
