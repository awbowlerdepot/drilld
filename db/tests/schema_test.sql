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
                                  thumb_to_middle_fit, thumb_to_ring_fit, bridge, middle_size_64, ring_size_64,
                                  spec, spec_schema_version) values
    ('70000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 1,
     '20000000-0000-0000-0000-0000000000a2', 4.25, 4.5, 0.25, 31, 31, '{}', 1),
    ('70000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '60000000-0000-0000-0000-0000000000b1', 1,
     '20000000-0000-0000-0000-0000000000b1', 3.5, 3.75, 0.25, 30, 30, '{}', 1);

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

-- ==========================================
-- As the API for company A
-- ==========================================
select set_config('app.company_id', '00000000-0000-0000-0000-00000000000a', false);

-- Isolation
select test.ok((select count(*) from company) = 1, 'company A sees only its own company');
select test.ok((select array_agg(first_name) from customer) = array['Alice'], 'company A sees only its customers');
select test.ok((select count(*) from company_ball) = 1, 'company A sees only its record of the shared ball');
select test.ok((select count(*) from work_order) = 1, 'company A sees only its work orders');
select test.ok((select count(*) from drill_sheet_revision) = 1, 'company A sees only its drill sheet revisions');
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
select test.fails($$update drill_sheet_revision set thumb_to_middle_fit = 4.5
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
select test.fails($$insert into drill_sheet_revision (company_id, drill_sheet_id, version, created_by_user_id, bridge, spec, spec_schema_version)
                    values ('00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 2,
                            '20000000-0000-0000-0000-0000000000a2', -0.25, '{}', 1)$$,
                  '23514', 'bridge cannot be negative');
insert into drill_sheet_revision (id, company_id, drill_sheet_id, version, created_by_user_id, thumb_to_middle_fit, spec, spec_schema_version)
    values ('70000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-0000000000a1', 2,
            '20000000-0000-0000-0000-0000000000a2', 4.3125, '{}', 1);
update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000a2'
    where id = '60000000-0000-0000-0000-0000000000a1';
select test.ok((select current_revision_id from drill_sheet where id = '60000000-0000-0000-0000-0000000000a1')
                   = '70000000-0000-0000-0000-0000000000a2', 'a new revision can become current');
select test.fails($$update drill_sheet set current_revision_id = '70000000-0000-0000-0000-0000000000b1'
                    where id = '60000000-0000-0000-0000-0000000000a1'$$,
                  '23503', 'the current revision must belong to the same drill sheet');

-- The one cross-company read: counts only, across every company
select test.ok((select (s.drill_count, s.plug_count, s.last_worked_month) = (1, 1, date '2025-03-01')
                from ball_service_summary('40000000-0000-0000-0000-000000000001') s),
               'ball_service_summary counts drilling across companies, by month');

-- ==========================================
-- As the API for company B
-- ==========================================
select set_config('app.company_id', '00000000-0000-0000-0000-00000000000b', false);

select test.ok((select array_agg(first_name) from customer) = array['Bob'], 'company B sees only its customers');
select test.ok((select notes from customer where first_name = 'Bob') is null, 'company B''s customer was not modified by company A');
select test.ok((select count(*) from location) = 1, 'company B does not see company A''s locations');

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
