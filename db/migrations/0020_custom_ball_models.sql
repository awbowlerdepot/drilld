-- migrate:up

-- ==========================================
-- Balls that aren't in the BowlerIQ catalog
-- ==========================================
-- Older and discontinued balls still come into shops, and BowlerIQ doesn't
-- publish every one. A company can type one in (brand, name, color, cover,
-- core): it's kept in the company's own list for reuse, and the physical ball
-- (ball registry) points at no catalog ball. With a known BowlerIQ brand, the
-- serial still makes it the same ball at every shop; with a brand BowlerIQ
-- doesn't have, it can't be matched across shops.

create table company_ball_model (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references company(id),
    -- The BowlerIQ brand, when it's one of theirs.
    brand_id    uuid,
    brand_name  text not null check (length(brand_name) between 1 and 100),
    name        text not null check (length(name) between 1 and 100),
    color       text check (length(color) <= 100),
    coverstock  text check (length(coverstock) <= 100),
    core        text check (length(core) <= 100),
    created_at  timestamptz not null default now(),
    unique (company_id, id)
);

create unique index company_ball_model_uq
    on company_ball_model (company_id, lower(brand_name), lower(name), lower(coalesce(color, '')));

grant select, insert, update on company_ball_model to drilld_app;
alter table company_ball_model enable row level security;
create policy tenant_isolation on company_ball_model
    using (company_id = app_company_id()) with check (company_id = app_company_id());

-- A registry ball typed in by a shop has no catalog ball, and maybe no BowlerIQ brand.
alter table ball alter column catalog_ball_id drop not null;
alter table ball alter column brand_id drop not null;
-- When BowlerIQ later publishes a ball a shop typed in, the next shop that
-- picks it from the catalog links the registry ball to it (only while unlinked;
-- the API checks the weight and brand match).
grant update (catalog_ball_id) on ball to drilld_app;

-- The company's record says which typed-in model it is.
alter table company_ball add column model_id uuid;
alter table company_ball add constraint company_ball_model_fk
    foreign key (company_id, model_id) references company_ball_model(company_id, id);

-- migrate:down

delete from ball_ownership where company_ball_id in (select id from company_ball where model_id is not null);
delete from company_ball where model_id is not null;
delete from ball where catalog_ball_id is null;
revoke update (catalog_ball_id) on ball from drilld_app;
alter table company_ball drop constraint company_ball_model_fk;
alter table company_ball drop column model_id;
alter table ball alter column brand_id set not null;
alter table ball alter column catalog_ball_id set not null;
drop table company_ball_model;
