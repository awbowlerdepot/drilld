-- migrate:up

-- ==========================================
-- Ball registry (platform-wide, identity only)
-- ==========================================
-- A physical ball can be drilled by one company, sold, and serviced by another,
-- so its identity is shared. Everything a company records or does to it is
-- tenant data in company_ball / work_order.
create table ball (
    id              uuid primary key default gen_random_uuid(),
    catalog_ball_id uuid not null,
    weight_lbs      smallint not null check (weight_lbs between 6 and 16),
    brand_id        uuid not null,               -- copied from catalog_ball; kept in sync by the foreign key
    serial_number   text check (serial_number <> '' and serial_number = upper(btrim(serial_number))),
    created_at      timestamptz not null default now(),
    foreign key (catalog_ball_id, brand_id) references catalog_ball(id, brand_id) on update cascade
);

-- Serial numbers are unique per brand. Balls without a serial are never matched.
create unique index ball_brand_serial_uq on ball (brand_id, serial_number) where serial_number is not null;

-- Readable for serial lookups; holds no tenant data. Identity never changes once registered.
grant select, insert on ball to drilld_app;

-- ==========================================
-- A company's record of a physical ball
-- ==========================================

create table company_ball (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references company(id),
    ball_id        uuid not null references ball(id),
    pin_distance   numeric(6,4) check (pin_distance >= 0),   -- inches, pin to CG, as recorded by this company
    top_weight     numeric(5,2) check (top_weight >= 0),     -- ounces
    specs          jsonb not null default '{}',              -- other per-ball specs
    status         text not null default 'ACTIVE' check (status in ('ACTIVE', 'RETIRED', 'DAMAGED')),
    purchase_date  date,
    purchase_price numeric(10,2) check (purchase_price >= 0),
    notes          text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (company_id, ball_id),
    unique (company_id, id)
);

-- ball_service_summary looks up every company's record of a ball.
create index company_ball_ball_idx on company_ball (ball_id);

create trigger company_ball_set_updated_at before update on company_ball
    for each row execute function set_updated_at();

grant select, insert, update, delete on company_ball to drilld_app;
alter table company_ball enable row level security;
create policy tenant_isolation on company_ball
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- ==========================================
-- Who owned the ball while this company handled it
-- ==========================================

create table ball_ownership (
    id              uuid primary key default gen_random_uuid(),
    company_id      uuid not null,
    company_ball_id uuid not null,
    customer_id     uuid not null,
    from_date       date not null,
    to_date         date,                        -- null = current owner
    created_at      timestamptz not null default now(),
    check (to_date is null or to_date >= from_date),
    foreign key (company_id, company_ball_id) references company_ball(company_id, id) on delete cascade,
    foreign key (company_id, customer_id)     references customer(company_id, id)
);

create unique index ball_ownership_current_uq on ball_ownership (company_ball_id) where to_date is null;
create index ball_ownership_customer_idx on ball_ownership (company_id, customer_id);

grant select, insert, update, delete on ball_ownership to drilld_app;
alter table ball_ownership enable row level security;
create policy tenant_isolation on ball_ownership
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- migrate:down

drop table ball_ownership;
drop table company_ball;
drop table ball;
