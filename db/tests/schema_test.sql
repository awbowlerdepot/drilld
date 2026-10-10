-- Schema tests. Run by db/test.sh against a throwaway database; every check
-- raises NOTICE 'ok - ...' or aborts with 'FAIL: ...'.
--
-- Fixed ids (company A = ...0a, company B = ...0b):
--   locations  1000...a1 (A Main), 1000...a2 (A West), 1000...b1 (B Shop)
--   users      2000...a1 (A admin), 2000...a2 (A tech), 2000...b1 (B manager)
--   customers  3000...a1 (Alice, A), 3000...b1 (Bob, B)
--   catalog    c000...01 (Hammer Widow Mania), brand b000...01
--   ball       4000...01 (serial HM12345), company_ball 5000...a1 / 5000...b1
--   sheets     6000...a1 / 6000...b1, revisions 7000...a1 / 7000...b1

-- ==========================================
-- Helpers and seed data (as the owner, which bypasses row-level security)
-- ==========================================
\connect drilld drilld_owner

create schema test;

create function test.ok(p_cond boolean, p_label text) returns void
language plpgsql as $$
begin
    if p_cond is distinct from true then
        raise exception 'FAIL: %', p_label;
    end if;
    raise notice 'ok - %', p_label;
end;
$$;

create function test.fails(p_sql text, p_sqlstate text, p_label text) returns void
language plpgsql as $$
begin
    begin
        execute p_sql;
    exception when others then
        if sqlstate <> p_sqlstate then
            raise exception 'FAIL: % (expected %, got %: %)', p_label, p_sqlstate, sqlstate, sqlerrm;
        end if;
        raise notice 'ok - % (%)', p_label, sqlstate;
        return;
    end;
    raise exception 'FAIL: % (expected error %, but it succeeded)', p_label, p_sqlstate;
end;
$$;

grant usage on schema test to drilld_app, drilld_catalog_sync;
grant execute on all functions in schema test to drilld_app, drilld_catalog_sync;

insert into company (id, name, plan_code) values
    ('00000000-0000-0000-0000-00000000000a', 'Company A', 'STANDARD'),
    ('00000000-0000-0000-0000-00000000000b', 'Company B', 'STANDARD');

insert into location (id, company_id, name, timezone) values
    ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'A Main', 'America/New_York'),
    ('10000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'A West', 'America/New_York'),
    ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'B Shop', 'America/Chicago');

insert into app_user (id, company_id, cognito_sub, email, first_name, last_name, company_role) values
    ('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'sub-a-admin', 'admin@a.test', 'Ann', 'Admin', 'ADMIN'),
    ('20000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'sub-a-tech', 'tech@a.test', 'Tom', 'Tech', null),
    ('20000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'sub-b-manager', 'manager@b.test', 'Bea', 'Boss', null);

-- Invited but not signed in yet: no Cognito sub until first sign-in (link_app_user).
insert into app_user (id, company_id, cognito_sub, email, first_name, last_name) values
    ('20000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-00000000000a', null, 'New.Hire@A.test', 'Nia', 'New');

insert into location_membership (company_id, user_id, location_id, role) values
    ('00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-0000000000a1', 'TECHNICIAN'),
    ('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000b1', 'MANAGER');

insert into customer (id, company_id, home_location_id, first_name, last_name, dominant_hand, preferred_grip_style) values
    ('30000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', 'Alice', 'Bowler', 'RIGHT', 'FINGERTIP'),
    ('30000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-0000000000b1', 'Bob', 'Roller', 'LEFT', 'CONVENTIONAL');

insert into catalog_ball (id, brand_id, brand_name, name, status, data, content_changed_at) values
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hammer', 'Widow Mania', 'current', '{}', now());

-- One physical ball, drilled by company A, later sold and plugged/redrilled at company B.
insert into ball (id, catalog_ball_id, weight_lbs, brand_id, serial_number) values
    ('40000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 15, 'b0000000-0000-0000-0000-000000000001', 'HM12345');

insert into company_ball (id, company_id, ball_id, pin_distance, top_weight) values
    ('50000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000001', 4.5, 2.75),
    ('50000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '40000000-0000-0000-0000-000000000001', 4.5, 2.75);

insert into drill_sheet (id, company_id, customer_id, name, grip_style) values
    ('60000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a1', 'Alice fingertip', 'FINGERTIP'),
    ('60000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-0000000000b1', 'Bob conventional', 'CONVENTIONAL');

insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id,
                                  thumb_to_middle_fit_32, thumb_to_ring_fit_32, bridge_32, middle_size_64, ring_size_64,
                                  spec, spec_schema_version) values
    ('70000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 1,
     '20000000-0000-0000-0000-0000000000a2', 136, 144, 8, 31, 31, '{}', 1),
    ('70000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '60000000-0000-0000-0000-0000000000b1', 1,
     '20000000-0000-0000-0000-0000000000b1', 112, 120, 8, 30, 30, '{}', 1);

update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000a1' where id = '60000000-0000-0000-0000-0000000000a1';
update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000b1' where id = '60000000-0000-0000-0000-0000000000b1';

insert into work_order (company_id, location_id, company_ball_id, customer_id, drill_sheet_revision_id, work_type, work_date) values
    ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a1',
     '30000000-0000-0000-0000-0000000000a1', '70000000-0000-0000-0000-0000000000a1', 'INITIAL_DRILL', '2025-01-15'),
    ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-0000000000b1', '50000000-0000-0000-0000-0000000000b1',
     '30000000-0000-0000-0000-0000000000b1', '70000000-0000-0000-0000-0000000000b1', 'PLUG_REDRILL', '2025-03-20'),
    ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-0000000000b1', '50000000-0000-0000-0000-0000000000b1',
     '30000000-0000-0000-0000-0000000000b1', null, 'SURFACE_ADJUSTMENT', '2025-06-02');

-- ==========================================
-- As the API, with no company set
-- ==========================================
\connect drilld app_tester

select test.ok((select count(*) from customer) = 0, 'no company set: sees no customers');
select test.ok((select count(*) from company) = 0, 'no company set: sees no companies');
select test.ok((select company_id from resolve_app_user('sub-b-manager')) = '00000000-0000-0000-0000-00000000000b',
               'resolve_app_user finds the user''s company before one is set');
select test.ok((select count(*) from resolve_app_user('no-such-sub')) = 0, 'resolve_app_user returns nothing for unknown users');

-- First sign-in linking (0008). Seeded users all have a Cognito sub, so add an unlinked one as the owner would.
select test.ok((select count(*) from link_app_user('sub-new', 'admin@a.test')) = 0,
               'link_app_user never relinks a user that already has a Cognito login');
select test.ok((select count(*) from link_app_user('sub-new', 'nobody@a.test')) = 0,
               'link_app_user returns nothing for an unknown email');
select test.ok((select company_id from link_app_user('sub-a-new-hire', 'new.hire@a.test')) = '00000000-0000-0000-0000-00000000000a',
               'link_app_user links an invited user by email, case-insensitively');
select test.ok((select company_id from resolve_app_user('sub-a-new-hire')) = '00000000-0000-0000-0000-00000000000a',
               'after linking, resolve_app_user finds the user');
select test.ok((select count(*) from link_app_user('sub-attacker', 'new.hire@a.test')) = 0,
               'a second login cannot claim an already-linked user');

-- ==========================================
-- As the API for company A
-- ==========================================
select set_config('app.company_id', '00000000-0000-0000-0000-00000000000a', false);

-- Isolation
select test.ok((select count(*) from company) = 1, 'company A sees only its own company');
select test.ok((select array_agg(first_name) from customer) = array['Alice'], 'company A sees only its customers');

-- Customer attachments (0014)
insert into customer_attachment (company_id, customer_id, storage_key, file_name, content_type, size_bytes, created_by_user_id) values
    ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a1', 'companies/a/customers/a1/sheet-1', 'sheet.jpg', 'image/jpeg', 580000, '20000000-0000-0000-0000-0000000000a2');
select test.ok((select kind from customer_attachment) = 'DRILL_SHEET', 'an attachment is a drill sheet scan by default');
select test.fails($$insert into customer_attachment (company_id, customer_id, storage_key, file_name, content_type, size_bytes, created_by_user_id)
    values ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000b1', 'companies/a/x', 'x.jpg', 'image/jpeg', 1, '20000000-0000-0000-0000-0000000000a2')$$,
    '23503', 'an attachment cannot be put on another company''s customer');
select test.fails($$insert into customer_attachment (company_id, customer_id, storage_key, file_name, content_type, size_bytes, created_by_user_id)
    values ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a1', 'companies/a/y', 'y.exe', 'application/octet-stream', 1, '20000000-0000-0000-0000-0000000000a2')$$,
    '23514', 'only images and PDFs can be attached');
select test.fails($$update customer_attachment set rotation = 45$$, '23514', 'rotation is a quarter turn');

-- Paper imports (0015)
insert into paper_import (company_id, storage_key, file_name, content_type, size_bytes, created_by_user_id) values
    ('00000000-0000-0000-0000-00000000000a', 'companies/a/imports/1', 'binder-1.jpg', 'image/jpeg', 500000, '20000000-0000-0000-0000-0000000000a2');
select test.ok((select status from paper_import) = 'UPLOADING', 'an import starts as uploading');
select test.fails($$update paper_import set status = 'DONE'$$, '23514', 'an import''s status must be a known one');
select test.fails($$update paper_import set span_type = 'tipToTip'$$, '23514', 'the span type must be one the spec has');
select test.fails($$update paper_import set customer_id = '30000000-0000-0000-0000-0000000000b1'$$, '23503', 'an import cannot be linked to another company''s customer');

-- Balls not in the catalog (0020)
insert into company_ball_model (company_id, brand_name, name, color) values
    ('00000000-0000-0000-0000-00000000000a', 'Storm', 'Hy-Road', 'Classic');
select test.fails($$insert into company_ball_model (company_id, brand_name, name, color) values
    ('00000000-0000-0000-0000-00000000000a', 'storm', 'HY-ROAD', 'classic')$$, '23505', 'a typed-in ball is kept once per company');

-- Ball layouts (0021)
insert into ball_layout (company_id, company_ball_id, drilled_on, layout) values
    ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-0000000000a1', current_date, '{"system": "PIN_BUFFER"}');
select test.fails($$insert into ball_layout (company_id, company_ball_id, drilled_on, layout) values
    ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-0000000000b1', current_date, '{}')$$, '23503', 'a layout cannot be on another company''s ball');
select test.fails($$update company_ball set psa_distance = 0$$, '23514', 'the pin to MB distance is more than zero');

-- A drilling records the drill sheet revision drilled, which locks it (0022)
insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id, updated_by_user_id, spec, spec_schema_version)
    select 'd2000000-0000-0000-0000-0000000000a9', company_id, drill_sheet_id, 99, created_by_user_id, created_by_user_id, spec, 1
    from drill_sheet_revision where company_id = '00000000-0000-0000-0000-00000000000a' limit 1;
update drill_sheet_revision set revision_notes = 'still a draft' where id = 'd2000000-0000-0000-0000-0000000000a9';
insert into ball_layout (company_id, company_ball_id, drilled_on, layout, drill_sheet_revision_id) values
    ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-0000000000a1', current_date, '{}', 'd2000000-0000-0000-0000-0000000000a9');
select test.fails($$update drill_sheet_revision set revision_notes = 'changed' where id = 'd2000000-0000-0000-0000-0000000000a9'$$,
    '23001', 'a revision a ball was drilled to cannot change');

-- Equipment and maintenance (0018)
insert into equipment (id, company_id, location_id, kind, name) values
    ('e0000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', 'DRILL_PRESS', 'Main press');
insert into maintenance_task (company_id, equipment_id, template_code, title, interval_days, next_due_on) values
    ('00000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-0000000000a1', 'MD-02', 'Way & column wipe-down', 1, current_date);
select test.fails($$insert into maintenance_task (company_id, equipment_id, template_code, title, interval_days)
    values ('00000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-0000000000a1', 'MD-02', 'Again', 7)$$,
    '23505', 'a machine has each standard task once');
select test.fails($$insert into maintenance_task (company_id, equipment_id, title) values
    ('00000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-0000000000a1', 'No interval')$$, '23514', 'a task needs an interval');
select test.fails($$insert into equipment (company_id, location_id, kind, name) values
    ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b1', 'OTHER', 'x')$$, '23503', 'equipment cannot be put at another company''s location');
insert into maintenance_log (company_id, equipment_id, kind, issue_type, title) values
    ('00000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-0000000000a1', 'ISSUE', 'JAM', 'Machine jammed');
select test.fails($$insert into maintenance_log (company_id, equipment_id, kind, title) values
    ('00000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-0000000000a1', 'ISSUE', 'Something')$$, '23514', 'a problem report says what kind');
select test.ok((select count(*) from company_ball) = 1, 'company A sees only its record of the shared ball');
select test.ok((select count(*) from work_order) = 1, 'company A sees only its work orders');
select test.ok((select count(*) from drill_sheet_revision) = 2, 'company A sees only its drill sheet revisions (its one, and the one a ball was drilled to)');
select test.ok((select count(*) from location_membership) = 1, 'company A sees only its memberships');
select test.ok((select count(*) from ball) = 1, 'ball registry is readable');
select test.ok((select count(*) from catalog_ball) = 1, 'ball catalog is readable');
select test.ok((select count(*) from plan) = 1, 'plans are readable');

select test.fails($$insert into customer (company_id, first_name, last_name, dominant_hand, preferred_grip_style)
                    values ('00000000-0000-0000-0000-00000000000b', 'Eve', 'Intruder', 'RIGHT', 'FINGERTIP')$$,
                  '42501', 'cannot insert rows for another company');
select test.fails($$update customer set company_id = '00000000-0000-0000-0000-00000000000b'
                    where id = '30000000-0000-0000-0000-0000000000a1'$$,
                  '42501', 'cannot move a row to another company');
with changed as (
    update customer set notes = 'hijacked' where id = '30000000-0000-0000-0000-0000000000b1' returning 1
)
select test.ok((select count(*) from changed) = 0, 'cannot update another company''s rows');

-- Composite foreign keys keep references inside the company
select test.fails($$insert into work_order (company_id, location_id, company_ball_id, customer_id, work_type, work_date)
                    values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b1',
                            '50000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', 'MAINTENANCE', '2025-05-01')$$,
                  '23503', 'cannot reference another company''s location');
select test.fails($$insert into work_order (company_id, location_id, company_ball_id, customer_id, drill_sheet_revision_id, work_type, work_date)
                    values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1',
                            '50000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
                            '70000000-0000-0000-0000-0000000000b1', 'INITIAL_DRILL', '2025-05-01')$$,
                  '23503', 'cannot drill to another company''s drill sheet');

-- Work order rules
select test.fails($$insert into work_order (company_id, location_id, company_ball_id, customer_id, work_type, work_date)
                    values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1',
                            '50000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', 'INITIAL_DRILL', '2025-05-01')$$,
                  '23514', 'drilling requires a drill sheet revision');

-- Platform tables are read-only to the API
select test.fails($$insert into catalog_ball (id, brand_id, brand_name, name, status, data, content_changed_at)
                    values (gen_random_uuid(), gen_random_uuid(), 'X', 'Y', 'current', '{}', now())$$,
                  '42501', 'API cannot write the ball catalog');
select test.fails($$update ball set serial_number = 'CHANGED'$$, '42501', 'ball identity cannot be changed');
select test.fails($$insert into company (name, plan_code) values ('New Co', 'STANDARD')$$, '42501', 'API cannot create companies');

-- Ball registry
select test.fails($$insert into ball (catalog_ball_id, weight_lbs, brand_id, serial_number)
                    values ('c0000000-0000-0000-0000-000000000001', 15, 'b0000000-0000-0000-0000-000000000001', 'HM12345')$$,
                  '23505', 'a serial number is unique per brand');
select test.fails($$insert into ball (catalog_ball_id, weight_lbs, brand_id, serial_number)
                    values ('c0000000-0000-0000-0000-000000000001', 15, 'b0000000-0000-0000-0000-000000000001', ' hm999 ')$$,
                  '23514', 'serial numbers must be normalized');
select test.fails($$insert into ball (catalog_ball_id, weight_lbs, brand_id, serial_number)
                    values ('c0000000-0000-0000-0000-000000000001', 15, gen_random_uuid(), 'HM55555')$$,
                  '23503', 'ball brand must match its catalog ball');
select test.fails($$insert into ball (catalog_ball_id, weight_lbs, brand_id)
                    values ('c0000000-0000-0000-0000-000000000001', 17, 'b0000000-0000-0000-0000-000000000001')$$,
                  '23514', 'ball weight must be 6 to 16 lbs');
insert into ball (catalog_ball_id, weight_lbs, brand_id) values
    ('c0000000-0000-0000-0000-000000000001', 14, 'b0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000001', 14, 'b0000000-0000-0000-0000-000000000001');
select test.ok((select count(*) from ball where serial_number is null) = 2, 'balls without serial numbers never collide');

-- Location limit (plan includes 4)
insert into location (company_id, name, timezone) values
    ('00000000-0000-0000-0000-00000000000a', 'A Third', 'America/New_York'),
    ('00000000-0000-0000-0000-00000000000a', 'A Fourth', 'America/New_York');
select test.ok((select count(*) from location where active) = 4, 'a company can have 4 active locations');
select test.fails($$insert into location (company_id, name, timezone)
                    values ('00000000-0000-0000-0000-00000000000a', 'A Fifth', 'America/New_York')$$,
                  '23514', 'a fifth active location is rejected');
insert into location (id, company_id, name, timezone, active) values
    ('10000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-00000000000a', 'A Fifth', 'America/New_York', false);
select test.ok((select count(*) from location) = 5, 'inactive locations do not count toward the limit');
select test.fails($$update location set active = true where id = '10000000-0000-0000-0000-0000000000a5'$$,
                  '23514', 'reactivating past the limit is rejected');

-- Drill sheet revisions are append-only
select test.fails($$update drill_sheet_revision set thumb_to_middle_fit_32 = 144
                    where id = '70000000-0000-0000-0000-0000000000a1'$$,
                  '23001', 'revision measurements cannot change');
update drill_sheet_revision
    set approved_at = now(), approved_by_user_id = '20000000-0000-0000-0000-0000000000a1'
    where id = '70000000-0000-0000-0000-0000000000a1';
select test.ok((select approved_at is not null from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a1'),
               'an unapproved revision can be approved');
select test.fails($$update drill_sheet_revision set approved_at = now()
                    where id = '70000000-0000-0000-0000-0000000000a1'$$,
                  '23001', 'an approved revision cannot change');
select test.fails($$delete from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a1'$$,
                  '42501', 'revisions cannot be deleted');
select test.fails($$insert into drill_sheet_revision (company_id, drill_sheet_id, version, created_by_user_id, spec, spec_schema_version)
                    values ('00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 1,
                            '20000000-0000-0000-0000-0000000000a2', '{}', 1)$$,
                  '23505', 'revision versions are unique per drill sheet');
select test.fails($$insert into drill_sheet_revision (company_id, drill_sheet_id, version, created_by_user_id, bridge_32, spec, spec_schema_version)
                    values ('00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 2,
                            '20000000-0000-0000-0000-0000000000a2', -8, '{}', 1)$$,
                  '23514', 'bridge cannot be negative');
insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id, thumb_to_middle_fit_32, spec, spec_schema_version)
    values ('70000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 2,
            '20000000-0000-0000-0000-0000000000a2', 138, '{}', 1);
update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000a2'
    where id = '60000000-0000-0000-0000-0000000000a1';
select test.ok((select current_revision_id from drill_sheet where id = '60000000-0000-0000-0000-0000000000a1')
                   = '70000000-0000-0000-0000-0000000000a2', 'a new revision can become current');
select test.fails($$update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000b1'
                    where id = '60000000-0000-0000-0000-0000000000a1'$$,
                  '23503', 'the current revision must belong to the same drill sheet');

-- Draft revisions (0007): editable until approved or drilled
update drill_sheet_revision set thumb_to_middle_fit_32 = 140, revision_notes = 'Remeasured'
    where id = '70000000-0000-0000-0000-0000000000a2';
select test.ok((select thumb_to_middle_fit_32 = 140 and updated_at > created_at
                from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a2'),
               'a draft revision can be edited in place, and updated_at moves');
select test.fails($$update drill_sheet_revision set version = 9 where id = '70000000-0000-0000-0000-0000000000a2'$$,
                  '23001', 'a draft''s version cannot change');
select test.fails($$update drill_sheet_revision set created_by_user_id = '20000000-0000-0000-0000-0000000000a1'
                    where id = '70000000-0000-0000-0000-0000000000a2'$$,
                  '23001', 'a draft''s author cannot change');
update drill_sheet_revision
    set approved_at = now(), approved_by_user_id = '20000000-0000-0000-0000-0000000000a2'
    where id = '70000000-0000-0000-0000-0000000000a2';
select test.ok((select approved_by_user_id = created_by_user_id
                from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a2'),
               'the author can approve their own revision');
select test.fails($$update drill_sheet_revision set thumb_to_middle_fit_32 = 144
                    where id = '70000000-0000-0000-0000-0000000000a2'$$,
                  '23001', 'an approved revision is locked');

insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id, thumb_to_middle_fit_32, spec, spec_schema_version)
    values ('70000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 3,
            '20000000-0000-0000-0000-0000000000a2', 136, '{}', 1);
insert into work_order (company_id, location_id, company_ball_id, customer_id, drill_sheet_revision_id, work_type, work_date)
    values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a1',
            '30000000-0000-0000-0000-0000000000a1', '70000000-0000-0000-0000-0000000000a3', 'PLUG_REDRILL', '2025-08-01');
select test.fails($$update drill_sheet_revision set thumb_to_middle_fit_32 = 144
                    where id = '70000000-0000-0000-0000-0000000000a3'$$,
                  '23001', 'an unapproved revision is locked once drilled');
update drill_sheet_revision
    set approved_at = now(), approved_by_user_id = '20000000-0000-0000-0000-0000000000a1'
    where id = '70000000-0000-0000-0000-0000000000a3';
select test.ok((select approved_at is not null from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a3'),
               'approval can still be recorded on a drilled revision');

-- Spans in 32nds and the bowler's delivery (0009)
insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id,
                                  thumb_to_middle_full_32, thumb_to_middle_cut_32, thumb_to_middle_outer_32, spec, spec_schema_version)
    values ('70000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 4,
            '20000000-0000-0000-0000-0000000000a2', 141, 139, 140, '{}', 1);
select test.ok((select thumb_to_middle_full_32 = 141 and thumb_to_middle_cut_32 = 139 and thumb_to_middle_outer_32 = 140
                from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a4'),
               'each span type is stored exactly, in 32nds (4-3/8"+ = 141)');
select test.fails($$update drill_sheet_revision set thumb_to_ring_outer_32 = 0
                    where id = '70000000-0000-0000-0000-0000000000a4'$$,
                  '23514', 'a span must be positive');
update customer set axis_tilt_degrees = 12.5, axis_rotation_degrees = 45, pap_over_32 = 176, pap_up_32 = -16,
                    speed_mph = 17.5, rev_rate_rpm = 350
    where id = '30000000-0000-0000-0000-0000000000a1';
select test.ok((select pap_over_32 = 176 and pap_up_32 = -16 and speed_mph = 17.5
                from customer where id = '30000000-0000-0000-0000-0000000000a1'),
               'a customer carries their current delivery (PAP below the center line is negative)');
select test.fails($$update customer set axis_tilt_degrees = 95 where id = '30000000-0000-0000-0000-0000000000a1'$$,
                  '23514', 'axis tilt is between 0 and 90 degrees');

-- Layout templates (0007): shop standards and a bowler's go-to
insert into layout_template (id, company_id, customer_id, name, layout, created_by_user_id) values
    ('90000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', null, 'Shop standard', '{"system": "DUAL_ANGLE"}',
     '20000000-0000-0000-0000-0000000000a1'),
    ('90000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a1', 'Alice go-to',
     '{"system": "VLS"}', '20000000-0000-0000-0000-0000000000a2');
select test.ok((select count(*) from layout_template) = 2, 'a company can save shop-standard and per-bowler layout templates');
select test.fails($$insert into layout_template (company_id, customer_id, name, layout, created_by_user_id)
                    values ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000b1', 'Bob go-to', '{}',
                            '20000000-0000-0000-0000-0000000000a1')$$,
                  '23503', 'a layout template cannot use another company''s customer');
insert into work_order (company_id, location_id, company_ball_id, customer_id, work_type, work_date, based_on_layout_template_id, layout)
    values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a1',
            '30000000-0000-0000-0000-0000000000a1', 'MAINTENANCE', '2025-09-01',
            '90000000-0000-0000-0000-0000000000a2', '{"system": "VLS"}');
select test.ok((select count(*) from work_order where based_on_layout_template_id = '90000000-0000-0000-0000-0000000000a2') = 1,
               'a work order records the layout template it started from');

-- The one cross-company read: counts only, across every company
-- 1 initial drill (A), 2 plug & redrills (B in March, A in August); maintenance not counted.
select test.ok((select (s.drill_count, s.plug_count, s.last_worked_month) = (1, 2, date '2025-08-01')
                from ball_service_summary('40000000-0000-0000-0000-000000000001') s),
               'ball_service_summary counts drilling across companies, by month');

-- Who last saved a revision (0011)
update drill_sheet_revision set updated_by_user_id = '20000000-0000-0000-0000-0000000000a1', revision_notes = 'Saved by another tech'
    where id = '70000000-0000-0000-0000-0000000000a4';
select test.ok((select updated_by_user_id = '20000000-0000-0000-0000-0000000000a1' and created_by_user_id = '20000000-0000-0000-0000-0000000000a2'
                from drill_sheet_revision where id = '70000000-0000-0000-0000-0000000000a4'),
               'a draft records who last saved it, apart from its author');
select test.fails($$update drill_sheet_revision set updated_by_user_id = '20000000-0000-0000-0000-0000000000b1'
                    where id = '70000000-0000-0000-0000-0000000000a4'$$,
                  '23503', 'the last saver must be one of the company''s users');

-- Grip catalog (0010): platform data, read-only; stock per location
select test.ok((select od64_choices[1] from grip_size gs join grip_line gl on gl.id = gs.line_id
                where gl.manufacturer = 'VISE' and gl.name = 'P/O Power Lift & Oval' and gs.label = '8.5') = 66,
               'VISE size 8.5 (53/64) takes a 1-1/32 O.D.');
select test.ok((select size64 = 52 and od64_choices = array[62]::smallint[] from grip_size gs join grip_line gl on gl.id = gs.line_id
                where gl.manufacturer = 'TURBO' and gl.name = 'Quad' and gs.label = '8'),
               'Turbo size 8 is 13/16 on a 31/32 O.D.');
select test.ok((select od64_choices = array[76]::smallint[] and collar from grip_size gs join grip_line gl on gl.id = gs.line_id
                where gl.name = 'IT Interchangeable Thumb' and gs.size64 = 72),
               'a 1-1/8 IT slug is drilled with the 1-3/16 collar bit');
select test.fails($$update grip_line set active = false$$, '42501', 'the API cannot change the grip catalog');
insert into location_grip_stock (company_id, location_id, grip_size_id)
    select '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000a1', gs.id
    from grip_size gs join grip_line gl on gl.id = gs.line_id where gl.manufacturer = 'JOPO' and gl.name = 'Power Flat / Oval';
select test.ok((select count(*) from location_grip_stock) = 15, 'a location records the line sizes it carries');
select test.fails($$insert into location_grip_stock (company_id, location_id, grip_size_id)
                    select '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b1', id from grip_size limit 1$$,
                  '23503', 'stock must be at one of the company''s own locations');

-- ==========================================
-- As the API for company B
-- ==========================================
select set_config('app.company_id', '00000000-0000-0000-0000-00000000000b', false);

select test.ok((select array_agg(first_name) from customer) = array['Bob'], 'company B sees only its customers');
select test.ok((select count(*) from customer_attachment) = 0, 'company B does not see company A''s attachments');
select test.ok((select count(*) from paper_import) = 0, 'company B does not see company A''s paper imports');
select test.ok((select count(*) from equipment) + (select count(*) from maintenance_task) + (select count(*) from maintenance_log) = 0, 'company B does not see company A''s equipment or maintenance');
select test.ok((select count(*) from company_ball_model) = 0, 'company B does not see company A''s typed-in balls');
select test.ok((select count(*) from ball_layout) = 0, 'company B does not see company A''s layouts');
select test.ok((select notes from customer where first_name = 'Bob') is null, 'company B''s customer was not modified by company A');
select test.ok((select count(*) from location) = 1, 'company B does not see company A''s locations');
select test.ok((select count(*) from layout_template) = 0, 'company B does not see company A''s layout templates');
select test.ok((select count(*) from location_grip_stock) = 0, 'company B does not see company A''s grip stock');
select test.ok((select count(*) from grip_line) > 30, 'every company reads the shared grip catalog');
select test.fails($$insert into work_order (company_id, location_id, company_ball_id, customer_id, work_type, work_date, based_on_layout_template_id)
                    values ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-0000000000b1', '50000000-0000-0000-0000-0000000000b1',
                            '30000000-0000-0000-0000-0000000000b1', 'MAINTENANCE', '2025-09-02',
                            '90000000-0000-0000-0000-0000000000a1')$$,
                  '23503', 'a work order cannot use another company''s layout template');

-- ==========================================
-- Leads and platform admins (0012), as the API
-- ==========================================
select set_config('app.company_id', '', false);

insert into lead (first_name, last_name, email, role, shop_name, location_count, balls_per_month, grips)
    values ('Pat', 'Lee', 'pat@shop.test', 'OWNER', 'Pat''s Pro Shop', 'TWO_TO_FOUR', '75_TO_150', array['VISE', 'TURBO']);
select test.ok((select count(*) from lead) = 0, 'a signup can add a lead but not read leads back');
select test.fails($$insert into lead (first_name, last_name, email, role, shop_name, location_count, balls_per_month, status)
                    values ('Sam', 'Ray', 'sam@shop.test', 'DRILLER', 'Ray''s', 'ONE', 'UNDER_25', 'QUALIFIED')$$,
                  '42501', 'a signup cannot set a lead''s status');
select test.fails($$insert into lead (first_name, last_name, email, role, shop_name, location_count, balls_per_month)
                    values ('Sam', 'Ray', 'not-an-email', 'DRILLER', 'Ray''s', 'ONE', 'UNDER_25')$$,
                  '23514', 'a lead needs a valid email');
select test.fails($$insert into lead (first_name, last_name, email, role, shop_name, location_count, balls_per_month, grips)
                    values ('Sam', 'Ray', 'sam@shop.test', 'DRILLER', 'Ray''s', 'ONE', 'UNDER_25', array['STORM'])$$,
                  '23514', 'grips must be known manufacturers');
select test.ok((select count(*) from lead_note) = 0, 'a signup cannot read lead notes');

select set_config('app.company_id', '00000000-0000-0000-0000-00000000000a', false);
select test.ok((select count(*) from lead) = 0, 'a company''s users cannot see leads, even owners');

select set_config('app.platform_admin', 'true', false);
select test.ok((select count(*) from lead) = 1, 'a platform admin sees leads');
update lead set status = 'CONTACTED' where email = 'pat@shop.test';
select test.ok((select status from lead where email = 'pat@shop.test') = 'CONTACTED', 'a platform admin can work a lead');
insert into lead_note (lead_id, author_name, body) select id, 'Al', 'Called; demo Tuesday' from lead where email = 'pat@shop.test';
select test.ok((select count(*) from lead_note) = 1, 'a platform admin can add notes');
select test.fails($$update lead set status = 'WON' where email = 'pat@shop.test'$$, '23514', 'a lead''s status must be a known one');
select test.ok((select count(*) from customer) = 1, 'being a platform admin grants nothing more in a company''s data');

select set_config('app.platform_admin', '', false);
select set_config('app.company_id', '', false);
select test.ok((select count(*) from lead) = 0, 'without the platform admin setting, leads are hidden again');

-- ==========================================
-- As the catalog sync job
-- ==========================================
\connect drilld sync_tester

insert into catalog_ball (id, brand_id, brand_name, name, status, data, content_changed_at) values
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Storm', 'Phaze II', 'current', '{}', now());
update catalog_sync_state set cursor = 'cursor-1', last_run_at = now();
select test.ok((select count(*) from catalog_ball) = 2, 'the sync job can write the catalog');
select test.ok((select cursor from catalog_sync_state) = 'cursor-1', 'the sync job can save its cursor');
select test.fails($$select count(*) from customer$$, '42501', 'the sync job cannot read tenant data');
select test.fails($$delete from catalog_ball$$, '42501', 'the sync job cannot delete catalog rows');
