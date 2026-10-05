-- migrate:up

-- ==========================================
-- Work orders: what was done to a ball, where, and to which spec
-- ==========================================

create table work_order (
    id                      uuid primary key default gen_random_uuid(),
    company_id              uuid not null,
    location_id             uuid not null,
    company_ball_id         uuid not null,
    customer_id             uuid not null,                 -- owner at the time of the work
    drill_sheet_revision_id uuid,                          -- the exact spec drilled
    work_type               text not null check (work_type in ('INITIAL_DRILL', 'PLUG_REDRILL', 'MAINTENANCE', 'SURFACE_ADJUSTMENT')),
    performed_by_user_id    uuid,
    work_date               date not null,
    started_at              timestamptz,
    ended_at                timestamptz,
    labor_hours             numeric(5,2) check (labor_hours >= 0),
    labor_cost              numeric(10,2) check (labor_cost >= 0),
    materials_cost          numeric(10,2) check (materials_cost >= 0),
    total_cost              numeric(10,2) check (total_cost >= 0),
    layout                  jsonb,                         -- per-ball layout, balance hole, surface
    deviations_from_spec    text,
    quality_check           boolean,
    quality_notes           text,
    customer_satisfaction   smallint check (customer_satisfaction between 1 and 5),
    warranty_days           int check (warranty_days >= 0),
    notes                   text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (company_id, id),
    check (ended_at is null or started_at is null or ended_at >= started_at),
    -- Drilling must record the spec it was drilled to.
    check (work_type not in ('INITIAL_DRILL', 'PLUG_REDRILL') or drill_sheet_revision_id is not null),
    foreign key (company_id, location_id)             references location(company_id, id),
    foreign key (company_id, company_ball_id)         references company_ball(company_id, id),
    foreign key (company_id, customer_id)             references customer(company_id, id),
    foreign key (company_id, drill_sheet_revision_id) references drill_sheet_revision(company_id, id),
    foreign key (company_id, performed_by_user_id)    references app_user(company_id, id)
);

create index work_order_location_date_idx on work_order (company_id, location_id, work_date desc);
create index work_order_ball_idx on work_order (company_ball_id);
create index work_order_customer_idx on work_order (company_id, customer_id);

create trigger work_order_set_updated_at before update on work_order
    for each row execute function set_updated_at();

grant select, insert, update, delete on work_order to drilld_app;
alter table work_order enable row level security;
create policy tenant_isolation on work_order
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- Photos are stored in S3; this table holds the keys.
create table work_order_photo (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null,
    work_order_id uuid not null,
    kind          text not null check (kind in ('BEFORE', 'AFTER')),
    s3_key        text not null,
    created_at    timestamptz not null default now(),
    foreign key (company_id, work_order_id) references work_order(company_id, id) on delete cascade
);

create index work_order_photo_work_order_idx on work_order_photo (work_order_id);

grant select, insert, update, delete on work_order_photo to drilld_app;
alter table work_order_photo enable row level security;
create policy tenant_isolation on work_order_photo
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- ==========================================
-- The one cross-company read
-- ==========================================
-- Anonymous service history of a registered ball across all companies:
-- counts and the month last worked on. Never returns a company, customer,
-- location, spec or layout. Runs as the table owner to read past
-- row-level security, so keep it this narrow.
create function ball_service_summary(p_ball_id uuid)
returns table (drill_count int, plug_count int, last_worked_month date)
language sql stable security definer set search_path = public, pg_temp as $$
    select
        count(*) filter (where wo.work_type = 'INITIAL_DRILL')::int,
        count(*) filter (where wo.work_type = 'PLUG_REDRILL')::int,
        date_trunc('month', max(wo.work_date) filter (where wo.work_type in ('INITIAL_DRILL', 'PLUG_REDRILL')))::date
    from work_order wo
    join company_ball cb on cb.id = wo.company_ball_id
    where cb.ball_id = p_ball_id
$$;

revoke all on function ball_service_summary(uuid) from public;
grant execute on function ball_service_summary(uuid) to drilld_app;

-- migrate:down

drop function ball_service_summary(uuid);
drop table work_order_photo;
drop table work_order;
