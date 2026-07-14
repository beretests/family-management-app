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
