create type public.grocery_list_status as enum ('open', 'completed', 'archived');

create function public.normalize_grocery_item_name(p_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(regexp_replace(btrim(p_name), '\s+', ' ', 'g'));
$$;

create table public.grocery_catalog_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  normalized_name text generated always as (public.normalize_grocery_item_name(name)) stored,
  category text check (category is null or char_length(category) <= 60),
  default_quantity numeric(8, 2) check (default_quantity is null or default_quantity > 0),
  default_unit text check (default_unit is null or char_length(default_unit) <= 30),
  active boolean not null default true,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id),
  unique (family_id, normalized_name),
  foreign key (created_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (created_by_member_id)
);

create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  status public.grocery_list_status not null default 'open',
  created_by_member_id uuid,
  closed_by_member_id uuid,
  closed_at timestamptz,
  delete_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id),
  foreign key (created_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (created_by_member_id),
  foreign key (closed_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (closed_by_member_id),
  check (
    (status = 'open' and closed_at is null and closed_by_member_id is null and delete_after is null)
    or
    (status <> 'open' and closed_at is not null and delete_after is not null)
  ),
  check (delete_after is null or delete_after >= closed_at)
);

create unique index grocery_lists_one_open_per_family_idx
  on public.grocery_lists(family_id)
  where status = 'open';

create index grocery_lists_retention_idx
  on public.grocery_lists(delete_after)
  where status <> 'open';

create table public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  grocery_list_id uuid not null,
  catalog_item_id uuid,
  name_snapshot text not null check (char_length(btrim(name_snapshot)) between 1 and 120),
  category_snapshot text check (category_snapshot is null or char_length(category_snapshot) <= 60),
  quantity numeric(8, 2) check (quantity is null or quantity > 0),
  unit text check (unit is null or char_length(unit) <= 30),
  note text check (note is null or char_length(note) <= 240),
  checked boolean not null default false,
  checked_by_member_id uuid,
  checked_at timestamptz,
  added_by_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (grocery_list_id, family_id)
    references public.grocery_lists(id, family_id)
    on delete cascade,
  foreign key (catalog_item_id, family_id)
    references public.grocery_catalog_items(id, family_id)
    on delete set null (catalog_item_id),
  foreign key (checked_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (checked_by_member_id),
  foreign key (added_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (added_by_member_id),
  check (
    (checked = false and checked_by_member_id is null and checked_at is null)
    or
    (checked = true and checked_by_member_id is not null and checked_at is not null)
  )
);

create unique index grocery_list_items_catalog_once_idx
  on public.grocery_list_items(grocery_list_id, catalog_item_id)
  where catalog_item_id is not null;

create index grocery_list_items_list_checked_idx
  on public.grocery_list_items(grocery_list_id, checked, created_at);

create trigger grocery_catalog_items_set_updated_at
  before update on public.grocery_catalog_items
  for each row execute function public.set_updated_at();
create trigger grocery_lists_set_updated_at
  before update on public.grocery_lists
  for each row execute function public.set_updated_at();
create trigger grocery_list_items_set_updated_at
  before update on public.grocery_list_items
  for each row execute function public.set_updated_at();

alter table public.grocery_catalog_items enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;

revoke all on table public.grocery_catalog_items from anon, authenticated;
revoke all on table public.grocery_lists from anon, authenticated;
revoke all on table public.grocery_list_items from anon, authenticated;

grant select, insert on table public.grocery_catalog_items to authenticated;
grant update (name, category, default_quantity, default_unit, active, updated_at)
  on table public.grocery_catalog_items to authenticated;

grant select, insert, delete on table public.grocery_lists to authenticated;
grant update (name, status, closed_by_member_id, closed_at, delete_after, updated_at)
  on table public.grocery_lists to authenticated;

grant select, insert, delete on table public.grocery_list_items to authenticated;
grant update (quantity, unit, note, checked, checked_by_member_id, checked_at, updated_at)
  on table public.grocery_list_items to authenticated;

create policy grocery_catalog_items_select_family
  on public.grocery_catalog_items for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy grocery_catalog_items_insert_family
  on public.grocery_catalog_items for insert to authenticated
  with check (
    public.current_user_is_family_member(family_id)
    and created_by_member_id = any(public.current_user_member_ids(family_id))
  );

create policy grocery_catalog_items_update_parent
  on public.grocery_catalog_items for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy grocery_lists_select_family
  on public.grocery_lists for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy grocery_lists_insert_family
  on public.grocery_lists for insert to authenticated
  with check (
    status = 'open'
    and created_by_member_id = any(public.current_user_member_ids(family_id))
  );

create policy grocery_lists_update_parent
  on public.grocery_lists for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    and (
      status = 'open'
      or closed_by_member_id = any(public.current_user_member_ids(family_id))
    )
  );

create policy grocery_lists_delete_parent
  on public.grocery_lists for delete to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy grocery_list_items_select_family
  on public.grocery_list_items for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy grocery_list_items_insert_family
  on public.grocery_list_items for insert to authenticated
  with check (
    added_by_member_id = any(public.current_user_member_ids(family_id))
    and exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.family_id = grocery_list_items.family_id
        and gl.status = 'open'
    )
  );

create policy grocery_list_items_update_family
  on public.grocery_list_items for update to authenticated
  using (
    public.current_user_is_family_member(family_id)
    and exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.family_id = grocery_list_items.family_id
        and gl.status = 'open'
    )
  )
  with check (
    public.current_user_is_family_member(family_id)
    and (
      checked_by_member_id is null
      or checked_by_member_id = any(public.current_user_member_ids(family_id))
    )
    and exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.family_id = grocery_list_items.family_id
        and gl.status = 'open'
    )
  );

create policy grocery_list_items_delete_family
  on public.grocery_list_items for delete to authenticated
  using (
    public.current_user_is_family_member(family_id)
    and exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.family_id = grocery_list_items.family_id
        and gl.status = 'open'
    )
  );
