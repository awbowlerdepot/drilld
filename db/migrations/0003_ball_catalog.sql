-- migrate:up

-- Local copy of the BowlerIQ Partner API catalog (see docs/data-model.md).
-- Platform data, not tenant data: readable by the API, written only by the sync job.
create table catalog_ball (
    id                 uuid primary key,          -- BowlerIQ ball id (one per colorway)
    brand_id           uuid not null,             -- BowlerIQ brand id
    brand_name         text not null,
    name               text not null,
    color              text,
    status             text not null check (status in ('current', 'retired')),
    data               jsonb not null,            -- full BowlerIQ Ball object: weights, coverstock, core, plotter, urls
    content_changed_at timestamptz not null,
    removed_at         timestamptz,               -- set on a 'remove' change; cleared by a later 'upsert'. Never deleted.
    synced_at          timestamptz not null default now(),
    unique (id, brand_id)                         -- target for ball's (catalog_ball_id, brand_id) foreign key
);

create index catalog_ball_search_idx on catalog_ball (lower(brand_name), lower(name)) where removed_at is null;

-- Single row: where the BowlerIQ change feed left off.
create table catalog_sync_state (
    id          smallint primary key default 1 check (id = 1),
    cursor      text,                             -- null until the first sync completes
    last_run_at timestamptz
);

insert into catalog_sync_state (id) values (1);

grant select on catalog_ball to drilld_app;
grant select, insert, update on catalog_ball, catalog_sync_state to drilld_catalog_sync;

-- migrate:down

drop table catalog_sync_state;
drop table catalog_ball;
