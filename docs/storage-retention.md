# Storage Retention

Phase 8 adds private evidence uploads for kid task submissions.

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
days. Phase 8 stores evidence metadata but does not run cleanup automatically.
Automated cleanup belongs to the reminders and cleanup phase.

Until cleanup is implemented:

- keep evidence uploads small
- avoid using evidence for long-term photo storage
- manually delete old evidence from Supabase Storage only after confirming the
  matching app metadata and review history no longer need it
