-- migrate:up

-- ==========================================
-- Roles
-- ==========================================
-- Group roles only (NOLOGIN). Login users for the backend are created by
-- infrastructure and granted membership, e.g.:
--   create role drilld_api login password '...' in role drilld_app;
do $$
begin
    if not exists (select from pg_roles where rolname = 'drilld_app') then
        -- The API. Subject to row-level security on every tenant table.
        create role drilld_app nologin;
    end if;
    if not exists (select from pg_roles where rolname = 'drilld_catalog_sync') then
        -- The BowlerIQ catalog sync job. Writes catalog tables only.
        create role drilld_catalog_sync nologin;
    end if;
end
$$;

grant usage on schema public to drilld_app, drilld_catalog_sync;

-- ==========================================
-- Shared functions
-- ==========================================

-- Keeps updated_at current.
create function set_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- The company the current request acts for. The backend sets it at the start
-- of every transaction from the verified Cognito user, never from client input:
--   select set_config('app.company_id', '<uuid>', true);
-- Returns null when unset, so row-level security policies match nothing.
create function app_company_id() returns uuid
language sql stable as $$
    select nullif(current_setting('app.company_id', true), '')::uuid
$$;

-- ==========================================
-- Plans
-- ==========================================

create table plan (
    code               text primary key,
    name               text not null,
    included_locations int  not null check (included_locations > 0)
);

insert into plan (code, name, included_locations) values ('STANDARD', 'Standard', 4);

grant select on plan to drilld_app;

-- ==========================================
-- Company (the tenant)
-- ==========================================

create table company (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    plan_code       text not null references plan(code),
    billing_cycle   text check (billing_cycle in ('MONTHLY', 'YEARLY')),  -- null until billing exists
    billing_email   text,
    billing_address jsonb,
    settings        jsonb not null default '{}',                           -- company-wide defaults
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger company_set_updated_at before update on company
    for each row execute function set_updated_at();

-- Companies are created by the platform (seed/admin script), not through the API.
grant select, update on company to drilld_app;
alter table company enable row level security;
create policy tenant_isolation on company
    using (id = app_company_id())
    with check (id = app_company_id());

-- ==========================================
-- Locations (physical pro shops)
-- ==========================================

create table location (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    name               text not null,
    address            jsonb,
    phone              text,
    timezone           text not null,
    hours              jsonb,
    equipment          jsonb not null default '[]',
    settings_overrides jsonb not null default '{}',   -- overrides company.settings
    active             boolean not null default true,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id)                           -- target for composite foreign keys
);

create trigger location_set_updated_at before update on location
    for each row execute function set_updated_at();

-- A company may have at most plan.included_locations active locations.
create function enforce_location_limit() returns trigger
language plpgsql as $$
declare
    v_limit  int;
    v_active int;
begin
    if not new.active then
        return new;
    end if;
    if tg_op = 'UPDATE' and old.active and old.company_id = new.company_id then
        return new;
    end if;

    -- Lock the company row so concurrent location changes are counted one at a time.
    select p.included_locations into v_limit
    from company c
    join plan p on p.code = c.plan_code
    where c.id = new.company_id
    for update of c;

    if v_limit is null then
        raise exception 'Company % not found', new.company_id
            using errcode = 'foreign_key_violation';
    end if;

    select count(*) into v_active
    from location
    where company_id = new.company_id and active and id <> new.id;

    if v_active >= v_limit then
        raise exception 'Company % already has % active locations, the limit for its plan', new.company_id, v_active
            using errcode = 'check_violation';
    end if;

    return new;
end;
$$;

create trigger location_enforce_limit before insert or update of active, company_id on location
    for each row execute function enforce_location_limit();

grant select, insert, update, delete on location to drilld_app;
alter table location enable row level security;
create policy tenant_isolation on location
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- ==========================================
-- Users and per-location roles
-- ==========================================

create table app_user (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references company(id),
    cognito_sub    text unique,                  -- null until the person first signs in
    email          text not null,
    first_name     text not null,
    last_name      text not null,
    phone          text,
    company_role   text check (company_role in ('OWNER', 'ADMIN')),  -- null = location roles only
    hire_date      date,
    hourly_rate    numeric(8,2) check (hourly_rate >= 0),
    specialties    text[] not null default '{}',
    certifications jsonb not null default '{}',
    active         boolean not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (company_id, id)
);

-- One company per person, so email is unique across the platform.
create unique index app_user_email_uq on app_user (lower(email));

create trigger app_user_set_updated_at before update on app_user
    for each row execute function set_updated_at();

grant select, insert, update, delete on app_user to drilld_app;
alter table app_user enable row level security;
create policy tenant_isolation on app_user
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

create table location_membership (
    company_id  uuid not null,
    user_id     uuid not null,
    location_id uuid not null,
    role        text not null check (role in ('MANAGER', 'SENIOR_TECH', 'TECHNICIAN', 'APPRENTICE')),
    created_at  timestamptz not null default now(),
    primary key (user_id, location_id),
    foreign key (company_id, user_id)     references app_user(company_id, id) on delete cascade,
    foreign key (company_id, location_id) references location(company_id, id)
);

create index location_membership_location_idx on location_membership (location_id);

grant select, insert, update, delete on location_membership to drilld_app;
alter table location_membership enable row level security;
create policy tenant_isolation on location_membership
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- Finds the signed-in user before any company is set. Bypasses row-level
-- security (runs as the table owner) and returns only what the backend needs
-- to set app.company_id.
create function resolve_app_user(p_cognito_sub text)
returns table (user_id uuid, company_id uuid, active boolean)
language sql stable security definer set search_path = public, pg_temp as $$
    select u.id, u.company_id, u.active
    from app_user u
    where u.cognito_sub = p_cognito_sub
$$;

revoke all on function resolve_app_user(text) from public;
grant execute on function resolve_app_user(text) to drilld_app;

-- migrate:down

drop function resolve_app_user(text);
drop table location_membership;
drop table app_user;
drop table location;
drop function enforce_location_limit();
drop table company;
drop table plan;
drop function app_company_id();
drop function set_updated_at();
revoke usage on schema public from drilld_app, drilld_catalog_sync;
drop role drilld_catalog_sync;
drop role drilld_app;
