-- migrate:up

-- ==========================================
-- Equipment and scheduled maintenance
-- ==========================================
-- Each location's machines (drill presses, spinners, resurfacers…) as
-- maintained assets. A machine has maintenance tasks, each due every so many
-- days (and, once work orders are on the API, every so many balls), with a
-- how-to and a checklist. Completing a task, or reporting a problem (a jam,
-- a snapped bit), goes in the machine's log. A new drill press starts with
-- the standard drill press tasks (shared/api/equipment.ts), scaled to the
-- shop's volume.

create table equipment (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    location_id        uuid not null,
    kind               text not null check (kind in ('DRILL_PRESS', 'BALL_SPINNER', 'RESURFACER', 'PLUG_SPINNER', 'VACUUM_PUMP', 'OTHER')),
    name               text not null check (length(name) between 1 and 100),
    manufacturer       text check (length(manufacturer) <= 100),
    model              text check (length(model) <= 100),
    serial_number      text check (length(serial_number) <= 100),
    purchased_on       date,
    status             text not null default 'IN_SERVICE' check (status in ('IN_SERVICE', 'OUT_OF_SERVICE', 'RETIRED')),
    -- How hard it works, which sets the standard task intervals.
    volume             text not null default 'STANDARD' check (volume in ('LOW', 'STANDARD', 'HIGH')),
    -- Per kind: a drill press's column type, jig type and readout direction.
    details            jsonb not null default '{}',
    notes              text check (length(notes) <= 2000),
    created_by_user_id uuid,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, location_id) references location(company_id, id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

create index equipment_location_idx on equipment (location_id);

create trigger equipment_set_updated_at before update on equipment
    for each row execute function set_updated_at();

create table maintenance_task (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null,
    equipment_id   uuid not null,
    -- The standard task it came from (e.g. MD-02), or null for the shop's own.
    template_code  text,
    title          text not null check (length(title) between 1 and 200),
    -- Why it matters, then how: plain text, a paragraph or step per line.
    guidance       text check (length(guidance) <= 5000),
    checklist      jsonb not null default '[]',
    video_url      text check (length(video_url) <= 500),
    -- Due every so many days and/or balls drilled, whichever comes first.
    interval_days  int check (interval_days between 1 and 3650),
    interval_balls int check (interval_balls between 1 and 100000),
    active         boolean not null default true,
    last_done_at   timestamptz,
    -- When it's next due (the location's date). Set from the interval when done; brought forward by a problem report.
    next_due_on    date,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (company_id, id),
    unique (equipment_id, template_code),
    check (interval_days is not null or interval_balls is not null),
    foreign key (company_id, equipment_id) references equipment(company_id, id) on delete cascade
);

create index maintenance_task_due_idx on maintenance_task (company_id, next_due_on) where active;

create trigger maintenance_task_set_updated_at before update on maintenance_task
    for each row execute function set_updated_at();

create table maintenance_log (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null,
    equipment_id     uuid not null,
    task_id          uuid,
    -- DONE: a task was completed. ISSUE: a problem was reported (jam, snapped bit…).
    kind             text not null check (kind in ('DONE', 'ISSUE')),
    issue_type       text check (issue_type in ('JAM', 'BIT_SNAPPED', 'OTHER')),
    title            text not null check (length(title) between 1 and 200),
    notes            text check (length(notes) <= 2000),
    -- The checklist as ticked when it was done.
    checklist        jsonb not null default '[]',
    done_by_user_id  uuid,
    done_at          timestamptz not null default now(),
    unique (company_id, id),
    check (kind <> 'ISSUE' or issue_type is not null),
    foreign key (company_id, equipment_id) references equipment(company_id, id) on delete cascade,
    foreign key (company_id, task_id) references maintenance_task(company_id, id) on delete set null (task_id),
    foreign key (company_id, done_by_user_id) references app_user(company_id, id)
);

create index maintenance_log_equipment_idx on maintenance_log (equipment_id, done_at desc);

grant select, insert, update, delete on equipment, maintenance_task, maintenance_log to drilld_app;
alter table equipment enable row level security;
alter table maintenance_task enable row level security;
alter table maintenance_log enable row level security;
create policy tenant_isolation on equipment
    using (company_id = app_company_id()) with check (company_id = app_company_id());
create policy tenant_isolation on maintenance_task
    using (company_id = app_company_id()) with check (company_id = app_company_id());
create policy tenant_isolation on maintenance_log
    using (company_id = app_company_id()) with check (company_id = app_company_id());

-- The old equipment list on each location moves into equipment records.
insert into equipment (company_id, location_id, kind, name, manufacturer, model, serial_number, status, notes)
select l.company_id, l.id, 'OTHER',
       left(coalesce(nullif(item->>'name', ''), 'Equipment'), 100),
       nullif(left(item->>'manufacturer', 100), ''),
       nullif(left(item->>'model', 100), ''),
       nullif(left(item->>'serialNumber', 100), ''),
       'IN_SERVICE',
       case when item->>'condition' = 'needs_repair' then 'Needs repair (from the old equipment list)' end
from location l, jsonb_array_elements(l.equipment) item;

alter table location drop column equipment;

-- migrate:down

alter table location add column equipment jsonb not null default '[]';
update location l set equipment = coalesce((
    select jsonb_agg(jsonb_build_object('name', e.name, 'model', coalesce(e.model, ''), 'manufacturer', e.manufacturer,
                                        'serialNumber', e.serial_number, 'condition', 'good'))
    from equipment e where e.location_id = l.id), '[]');
drop table maintenance_log;
drop table maintenance_task;
drop table equipment;
