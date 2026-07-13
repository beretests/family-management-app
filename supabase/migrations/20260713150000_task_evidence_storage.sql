alter table public.task_instances
  add column if not exists requires_evidence_snapshot boolean not null default false,
  add column if not exists evidence_type_snapshot public.evidence_type,
  add column if not exists completion_check_text_snapshot text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'task-evidence',
  'task-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_evidence_family_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = public, storage
as $$
declare
  parts text[];
begin
  parts := storage.foldername(object_name);

  if array_length(parts, 1) < 3 or parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  return parts[1]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.storage_evidence_task_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = public, storage
as $$
declare
  parts text[];
begin
  parts := storage.foldername(object_name);

  if array_length(parts, 1) < 3 or parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  return parts[2]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.storage_evidence_member_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = public, storage
as $$
declare
  parts text[];
begin
  parts := storage.foldername(object_name);

  if array_length(parts, 1) < 3 or parts[3] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  return parts[3]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.submit_task_instance(
  p_task_instance_id uuid,
  p_submitted_by_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.task_instances%rowtype;
begin
  select *
  into task_row
  from public.task_instances
  where id = p_task_instance_id
  for update;

  if task_row.id is null then
    raise exception 'Task not found.';
  end if;

  if task_row.status not in ('assigned', 'in_progress', 'rejected') then
    raise exception 'Task cannot be submitted from its current status.';
  end if;

  if task_row.assigned_to_member_id is distinct from p_submitted_by_member_id then
    raise exception 'Only the assigned family member can submit this task.';
  end if;

  if p_submitted_by_member_id <> all(public.current_user_member_ids(task_row.family_id)) then
    raise exception 'Only the assigned family member can submit this task.';
  end if;

  update public.task_instances
  set status = 'submitted',
      submitted_at = now(),
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where id = p_task_instance_id;
end;
$$;

revoke all on function public.submit_task_instance(uuid, uuid) from public;
grant execute on function public.submit_task_instance(uuid, uuid) to authenticated;

create policy task_evidence_objects_insert_assignee
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'task-evidence'
    and public.storage_evidence_family_id(name) is not null
    and public.storage_evidence_task_id(name) is not null
    and public.storage_evidence_member_id(name) is not null
    and public.storage_evidence_member_id(name) = any(
      public.current_user_member_ids(public.storage_evidence_family_id(name))
    )
    and exists (
      select 1
      from public.task_instances ti
      where ti.id = public.storage_evidence_task_id(name)
        and ti.family_id = public.storage_evidence_family_id(name)
        and ti.assigned_to_member_id = public.storage_evidence_member_id(name)
    )
    and public.current_user_can_submit_task(public.storage_evidence_task_id(name))
  );

create policy task_evidence_objects_select_task_reader
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'task-evidence'
    and public.storage_evidence_task_id(name) is not null
    and public.current_user_can_read_task(public.storage_evidence_task_id(name))
  );
