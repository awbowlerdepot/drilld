-- migrate:up

-- ==========================================
-- Platform admins
-- ==========================================
-- People who run Drilld itself (not a shop). Membership is the Cognito group
-- `platform-admin`, checked by the API along with TOTP MFA; the database never
-- grants it. For a verified platform admin the backend sets, per transaction:
--   select set_config('app.platform_admin', 'true', true);
-- It's unrelated to tenancy: it grants nothing in any company's data.
create function app_platform_admin() returns boolean
language sql stable as $$
    select coalesce(current_setting('app.platform_admin', true), '') = 'true'
$$;

-- ==========================================
-- Leads: early access signups from drilld.io (platform data)
-- ==========================================
-- Anyone can sign up through the public API route, which can only insert a
-- new lead. Reading and working leads is for platform admins.

create table lead (
    id                uuid primary key default gen_random_uuid(),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    status            text not null default 'NEW'
                      check (status in ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO', 'ONBOARDED', 'NOT_A_FIT', 'SPAM')),

    -- You
    first_name        text not null check (length(first_name) between 1 and 100),
    last_name         text not null check (length(last_name) between 1 and 100),
    email             text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
    phone             text check (length(phone) <= 40),
    role              text not null check (role in ('OWNER', 'MANAGER', 'DRILLER', 'OTHER')),

    -- Your shop
    shop_name         text not null check (length(shop_name) between 1 and 200),
    city              text check (length(city) <= 100),
    region            text check (length(region) <= 100),                 -- state or province
    country           text not null default 'US' check (country ~ '^[A-Z]{2}$'),
    location_count    text not null check (location_count in ('ONE', 'TWO_TO_FOUR', 'FIVE_PLUS')),
    shop_type         text check (shop_type in ('BOWLING_CENTER', 'STANDALONE', 'MOBILE')),
    balls_per_month   text not null check (balls_per_month in ('UNDER_25', '25_TO_75', '75_TO_150', 'OVER_150')),
    driller_count     text check (driller_count in ('ONE', 'TWO_TO_THREE', 'FOUR_PLUS')),
    drill_press       text check (drill_press in ('MANUAL', 'DIGITAL_READOUT', 'CNC')),

    -- How you work today
    current_tools     text check (current_tools in ('PAPER', 'SPREADSHEET', 'SOFTWARE', 'OTHER')),
    current_software  text check (length(current_software) <= 200),    -- which software, if any
    grips             text[] not null default '{}' check (grips <@ array['VISE', 'TURBO', 'JOPO', 'OTHER']),
    timeline          text check (timeline in ('NOW', 'WITHIN_3_MONTHS', 'LOOKING')),
    pain_point        text check (length(pain_point) <= 2000),
    heard_from        text check (length(heard_from) <= 200),

    marketing_consent boolean not null default false,
    source            jsonb not null default '{}',     -- referrer and utm_* tags from the signup page
    company_id        uuid references company(id)      -- the company created when the lead was onboarded
);

create index lead_created_at_idx on lead (created_at desc);
create index lead_email_idx on lead (lower(email));

create trigger lead_set_updated_at before update on lead
    for each row execute function set_updated_at();

-- What happened with a lead: calls, emails, demo notes.
create table lead_note (
    id           uuid primary key default gen_random_uuid(),
    lead_id      uuid not null references lead(id) on delete cascade,
    created_at   timestamptz not null default now(),
    author_name  text not null,                       -- a snapshot: app_user is tenant data
    body         text not null check (length(body) between 1 and 5000)
);

create index lead_note_lead_idx on lead_note (lead_id, created_at);

grant select, insert, update, delete on lead to drilld_app;
grant select, insert, delete on lead_note to drilld_app;

alter table lead enable row level security;
alter table lead_note enable row level security;

-- A signup can only add a new lead: it can't set its status or link it to a
-- company, and (with no select policy) can't read it, or any other, back.
create policy lead_signup on lead for insert
    with check (status = 'NEW' and company_id is null);
create policy lead_platform_admin on lead
    using (app_platform_admin())
    with check (app_platform_admin());
create policy lead_note_platform_admin on lead_note
    using (app_platform_admin())
    with check (app_platform_admin());

-- migrate:down

drop table lead_note;
drop table lead;
drop function app_platform_admin();
