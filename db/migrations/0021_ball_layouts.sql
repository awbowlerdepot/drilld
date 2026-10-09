-- migrate:up

-- ==========================================
-- Ball layouts
-- ==========================================
-- How each of a company's balls was laid out, one row per drilling (the first
-- drilling, then each plug and redrill): the system and numbers the driller
-- worked in (pin buffer / VLS, Dual Angle, 2LS), the bowler's PAP as used,
-- and the ball's pin-to-PSA distance as used. The other systems' numbers are
-- calculated from these (shared/layout/ballLayout.ts), never stored. The
-- latest drilling is the ball's current layout. Work orders, once on the API,
-- will point at the layout they drilled.

-- Pin to MB on an asymmetric ball, as measured by this company (inches);
-- null = 6¾″ (a symmetric ball's PSA mark, through the CG).
alter table company_ball add column psa_distance numeric(6,4) check (psa_distance > 0 and psa_distance <= 13.5);

create table ball_layout (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    company_ball_id    uuid not null,
    drilled_on         date not null,
    -- { system, numbers, pap: { over32, up32, from }, hand, psaDistance32, layoutSchemaVersion }: shared/api/ballLayouts.ts
    layout             jsonb not null,
    notes              text check (length(notes) <= 2000),
    created_by_user_id uuid,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, company_ball_id) references company_ball(company_id, id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

create index ball_layout_ball_idx on ball_layout (company_ball_id, drilled_on desc, created_at desc);

create trigger ball_layout_set_updated_at before update on ball_layout
    for each row execute function set_updated_at();

grant select, insert, update, delete on ball_layout to drilld_app;
alter table ball_layout enable row level security;
create policy tenant_isolation on ball_layout
    using (company_id = app_company_id()) with check (company_id = app_company_id());

-- migrate:down

drop table ball_layout;
alter table company_ball drop column psa_distance;
