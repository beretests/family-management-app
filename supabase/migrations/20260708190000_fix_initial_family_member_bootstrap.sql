create or replace function public.current_user_created_family_without_members(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.families f
    where f.id = p_family_id
      and f.created_by_profile_id = auth.uid()
      and not exists (
        select 1
        from public.family_members fm
        where fm.family_id = p_family_id
      )
  );
$$;

drop policy if exists family_members_insert_initial_parent on public.family_members;

create policy family_members_insert_initial_parent on public.family_members
  for insert to authenticated
  with check (
    role = 'parent'
    and profile_id = auth.uid()
    and public.current_user_created_family_without_members(family_id)
  );
