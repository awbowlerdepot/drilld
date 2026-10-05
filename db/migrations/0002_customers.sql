-- migrate:up

-- Bowlers. Company-level: shared across the company's locations.
create table customer (
    id                   uuid primary key default gen_random_uuid(),
    company_id           uuid not null references company(id),
    home_location_id     uuid,
    first_name           text not null,
    last_name            text not null,
    email                text,
    phone                text,
    dominant_hand        text not null check (dominant_hand in ('LEFT', 'RIGHT')),
    preferred_grip_style text not null check (preferred_grip_style in ('CONVENTIONAL', 'FINGERTIP', 'TWO_HANDED_NO_THUMB')),
    uses_thumb           boolean not null default true,
    notes                text,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, home_location_id) references location(company_id, id)
);

create index customer_name_idx on customer (company_id, lower(last_name), lower(first_name));

create trigger customer_set_updated_at before update on customer
    for each row execute function set_updated_at();

grant select, insert, update, delete on customer to drilld_app;
alter table customer enable row level security;
create policy tenant_isolation on customer
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

-- migrate:down

drop table customer;
