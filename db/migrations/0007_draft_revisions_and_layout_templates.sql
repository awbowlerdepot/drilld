-- migrate:up

-- ==========================================
-- Editable draft revisions
-- ==========================================
-- A revision is a draft until it is approved or used on a work order. Drafts
-- can be edited in place; after that the revision is locked and changes start
-- a new draft revision. Recording approval is always allowed on an unapproved
-- revision, even one already drilled (approval only records who signed off).

alter table drill_sheet_revision add column updated_at timestamptz not null default now();

create trigger drill_sheet_revision_set_updated_at before update on drill_sheet_revision
    for each row execute function set_updated_at();

create or replace function protect_drill_sheet_revision() returns trigger
language plpgsql as $$
begin
    if tg_op = 'DELETE' then
        raise exception 'Drill sheet revisions cannot be deleted'
            using errcode = 'restrict_violation';
    end if;

    if old.approved_at is not null then
        raise exception 'Drill sheet revision % is approved and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    if new.company_id is distinct from old.company_id
       or new.drill_sheet_id is distinct from old.drill_sheet_id
       or new.version is distinct from old.version
       or new.created_by_user_id is distinct from old.created_by_user_id
       or new.created_at is distinct from old.created_at then
        raise exception 'A revision''s sheet, version, author and creation time cannot change'
            using errcode = 'restrict_violation';
    end if;

    -- Used on a work order: only approval may still be recorded.
    if exists (select from work_order where drill_sheet_revision_id = old.id)
       and (to_jsonb(new) - 'approved_at' - 'approved_by_user_id' - 'updated_at')
           is distinct from (to_jsonb(old) - 'approved_at' - 'approved_by_user_id' - 'updated_at') then
        raise exception 'Drill sheet revision % has been drilled and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    return new;
end;
$$;

comment on column drill_sheet_revision.bridge is
    'Inches, edge-to-edge: the material between the middle and ring finger holes.';
comment on column drill_sheet_revision.spec is
    'Full drill sheet spec (docs/data-model.md, spec_schema_version). Pitch values are inches only.';

-- ==========================================
-- Layout templates
-- ==========================================
-- Reusable starting points for a work order's layout: a bowler's go-to
-- (customer_id set) or a shop standard (customer_id null). A work order copies
-- the layout, so changing a template never changes past work.

create table layout_template (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    customer_id        uuid,                          -- null = shop standard
    name               text not null,
    layout             jsonb not null,                -- work_order.layout shape, without balanceHole and surface
    created_by_user_id uuid not null,
    archived_at        timestamptz,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, customer_id)        references customer(company_id, id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

create index layout_template_customer_idx on layout_template (company_id, customer_id);

create trigger layout_template_set_updated_at before update on layout_template
    for each row execute function set_updated_at();

grant select, insert, update, delete on layout_template to drilld_app;
alter table layout_template enable row level security;
create policy tenant_isolation on layout_template
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

alter table work_order add column based_on_layout_template_id uuid;
alter table work_order
    add constraint work_order_layout_template_fk
    foreign key (company_id, based_on_layout_template_id) references layout_template(company_id, id);

-- migrate:down

alter table work_order drop constraint work_order_layout_template_fk;
alter table work_order drop column based_on_layout_template_id;
drop table layout_template;

comment on column drill_sheet_revision.spec is null;
comment on column drill_sheet_revision.bridge is null;

-- Back to 0005's rule: revisions never change except approving, once.
create or replace function protect_drill_sheet_revision() returns trigger
language plpgsql as $$
begin
    if tg_op = 'DELETE' then
        raise exception 'Drill sheet revisions cannot be deleted'
            using errcode = 'restrict_violation';
    end if;

    if old.approved_at is not null then
        raise exception 'Drill sheet revision % is approved and cannot change', old.id
            using errcode = 'restrict_violation';
    end if;

    if (to_jsonb(new) - 'approved_at' - 'approved_by_user_id')
       is distinct from (to_jsonb(old) - 'approved_at' - 'approved_by_user_id') then
        raise exception 'Drill sheet revision % cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    return new;
end;
$$;

drop trigger drill_sheet_revision_set_updated_at on drill_sheet_revision;
alter table drill_sheet_revision drop column updated_at;
