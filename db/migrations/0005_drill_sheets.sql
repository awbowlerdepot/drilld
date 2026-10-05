-- migrate:up

-- ==========================================
-- Drill sheets: the bowler's fit
-- ==========================================
-- Ball-specific layout (pin, CG, balance hole, surface) lives on work_order.

create table drill_sheet (
    id                   uuid primary key default gen_random_uuid(),
    company_id           uuid not null references company(id),
    customer_id          uuid,                           -- null for templates
    name                 text not null,
    grip_style           text not null check (grip_style in ('CONVENTIONAL', 'FINGERTIP', 'TWO_HANDED_NO_THUMB')),
    is_template          boolean not null default false,
    based_on_template_id uuid,
    current_revision_id  uuid,                           -- foreign key added below
    archived_at          timestamptz,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    unique (company_id, id),
    check (is_template or customer_id is not null),
    foreign key (company_id, customer_id)          references customer(company_id, id),
    foreign key (company_id, based_on_template_id) references drill_sheet(company_id, id)
);

create index drill_sheet_customer_idx on drill_sheet (company_id, customer_id);

create trigger drill_sheet_set_updated_at before update on drill_sheet
    for each row execute function set_updated_at();

-- ==========================================
-- Revisions: append-only snapshots of the spec
-- ==========================================
-- Lengths are inches (exact numeric). Hole sizes are whole 64ths of an inch.

create table drill_sheet_revision (
    id                   uuid primary key default gen_random_uuid(),
    company_id           uuid not null,
    drill_sheet_id       uuid not null,
    version              int  not null check (version >= 1),
    location_id          uuid,                           -- where it was measured
    created_by_user_id   uuid not null,
    revision_notes       text,
    approved_by_user_id  uuid,
    approved_at          timestamptz,

    -- Promoted, queryable measurements. Span types and bridge are separate measurements.
    thumb_to_middle_fit  numeric(6,4) check (thumb_to_middle_fit > 0),
    thumb_to_middle_full numeric(6,4) check (thumb_to_middle_full > 0),
    thumb_to_ring_fit    numeric(6,4) check (thumb_to_ring_fit > 0),
    thumb_to_ring_full   numeric(6,4) check (thumb_to_ring_full > 0),
    bridge               numeric(6,4) check (bridge >= 0),
    thumb_size_64        smallint check (thumb_size_64 > 0),
    middle_size_64       smallint check (middle_size_64 > 0),
    ring_size_64         smallint check (ring_size_64 > 0),

    -- Full spec, validated by the backend against spec_schema_version.
    spec                 jsonb not null,
    spec_schema_version  smallint not null check (spec_schema_version >= 1),
    created_at           timestamptz not null default now(),

    unique (drill_sheet_id, version),
    unique (drill_sheet_id, id),                     -- target for drill_sheet.current_revision_id
    unique (company_id, id),
    check ((approved_at is null) = (approved_by_user_id is null)),
    foreign key (company_id, drill_sheet_id)      references drill_sheet(company_id, id),
    foreign key (company_id, location_id)         references location(company_id, id),
    foreign key (company_id, created_by_user_id)  references app_user(company_id, id),
    foreign key (company_id, approved_by_user_id) references app_user(company_id, id)
);

-- The current revision must belong to the same drill sheet.
alter table drill_sheet
    add foreign key (id, current_revision_id) references drill_sheet_revision(drill_sheet_id, id);

-- Revisions never change once written. The only allowed update is approving
-- an unapproved revision, once. Deleting is never allowed.
create function protect_drill_sheet_revision() returns trigger
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

create trigger drill_sheet_revision_protect before update or delete on drill_sheet_revision
    for each row execute function protect_drill_sheet_revision();

grant select, insert, update, delete on drill_sheet to drilld_app;
alter table drill_sheet enable row level security;
create policy tenant_isolation on drill_sheet
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- No delete: revisions are permanent.
grant select, insert, update on drill_sheet_revision to drilld_app;
alter table drill_sheet_revision enable row level security;
create policy tenant_isolation on drill_sheet_revision
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- migrate:down

alter table drill_sheet drop column current_revision_id;
drop table drill_sheet_revision;
drop function protect_drill_sheet_revision();
drop table drill_sheet;
