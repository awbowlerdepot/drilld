-- migrate:up

-- ==========================================
-- Spans and bridge in whole 32nds of an inch
-- ==========================================
-- Shops measure spans, bridge and pitch in 16ths, with "+" adding 1/32
-- (4-3/8"+ = 4-13/32"), so whole 32nds hold them exactly: 4-13/32" is 141.
-- Changing the type rewrites the column without firing the revision triggers;
-- any existing value is rounded to the nearest 32nd.

alter table drill_sheet_revision rename column thumb_to_middle_fit  to thumb_to_middle_fit_32;
alter table drill_sheet_revision rename column thumb_to_middle_full to thumb_to_middle_full_32;
alter table drill_sheet_revision rename column thumb_to_ring_fit    to thumb_to_ring_fit_32;
alter table drill_sheet_revision rename column thumb_to_ring_full   to thumb_to_ring_full_32;
alter table drill_sheet_revision rename column bridge               to bridge_32;

alter table drill_sheet_revision
    alter column thumb_to_middle_fit_32  type smallint using round(thumb_to_middle_fit_32 * 32),
    alter column thumb_to_middle_full_32 type smallint using round(thumb_to_middle_full_32 * 32),
    alter column thumb_to_ring_fit_32    type smallint using round(thumb_to_ring_fit_32 * 32),
    alter column thumb_to_ring_full_32   type smallint using round(thumb_to_ring_full_32 * 32),
    alter column bridge_32               type smallint using round(bridge_32 * 32);

-- The other span types. Each is its own measurement; they are not converted
-- into one another (spans run over a sphere between pitched holes).
alter table drill_sheet_revision
    add column thumb_to_middle_cut_32   smallint check (thumb_to_middle_cut_32 > 0),
    add column thumb_to_middle_outer_32 smallint check (thumb_to_middle_outer_32 > 0),
    add column thumb_to_middle_ctc_32   smallint check (thumb_to_middle_ctc_32 > 0),
    add column thumb_to_ring_cut_32     smallint check (thumb_to_ring_cut_32 > 0),
    add column thumb_to_ring_outer_32   smallint check (thumb_to_ring_outer_32 > 0),
    add column thumb_to_ring_ctc_32     smallint check (thumb_to_ring_ctc_32 > 0);

comment on column drill_sheet_revision.thumb_to_middle_full_32 is
    'Full span in 32nds of an inch: gripping edge to gripping edge.';
comment on column drill_sheet_revision.thumb_to_middle_cut_32 is
    'Cut-to-cut span in 32nds of an inch: drilled hole edge to drilled hole edge, before hardware.';
comment on column drill_sheet_revision.thumb_to_middle_outer_32 is
    'Outer-to-cut span in 32nds of an inch: outer edge of the thumb hardware (inner not installed) to the finger''s drilled hole edge.';
comment on column drill_sheet_revision.thumb_to_middle_ctc_32 is
    'Center-to-center span in 32nds of an inch (CAD/CNC spec).';
comment on column drill_sheet_revision.thumb_to_middle_fit_32 is
    'Fit span in 32nds of an inch: center of the finger hole to the cut edge of the thumb.';
comment on column drill_sheet_revision.bridge_32 is
    'Bridge in 32nds of an inch, edge-to-edge: the material between the middle and ring finger holes.';

-- ==========================================
-- The bowler's current delivery, on the customer
-- ==========================================
-- Each drill sheet revision keeps a copy in spec.delivery as of that fitting.

alter table customer
    add column axis_tilt_degrees     numeric(4,1) check (axis_tilt_degrees between 0 and 90),
    add column axis_rotation_degrees numeric(4,1) check (axis_rotation_degrees between 0 and 90),
    add column pap_over_32           smallint check (pap_over_32 >= 0),   -- inches from the center line, in 32nds
    add column pap_up_32             smallint,                            -- in 32nds; negative = down
    add column speed_mph             numeric(4,1) check (speed_mph > 0),
    add column rev_rate_rpm          smallint check (rev_rate_rpm > 0);

-- migrate:down

alter table customer
    drop column axis_tilt_degrees,
    drop column axis_rotation_degrees,
    drop column pap_over_32,
    drop column pap_up_32,
    drop column speed_mph,
    drop column rev_rate_rpm;

comment on column drill_sheet_revision.thumb_to_middle_full_32 is null;
comment on column drill_sheet_revision.thumb_to_middle_fit_32 is null;

alter table drill_sheet_revision
    drop column thumb_to_middle_cut_32,
    drop column thumb_to_middle_outer_32,
    drop column thumb_to_middle_ctc_32,
    drop column thumb_to_ring_cut_32,
    drop column thumb_to_ring_outer_32,
    drop column thumb_to_ring_ctc_32;

alter table drill_sheet_revision
    alter column thumb_to_middle_fit_32  type numeric(6,4) using thumb_to_middle_fit_32 / 32.0,
    alter column thumb_to_middle_full_32 type numeric(6,4) using thumb_to_middle_full_32 / 32.0,
    alter column thumb_to_ring_fit_32    type numeric(6,4) using thumb_to_ring_fit_32 / 32.0,
    alter column thumb_to_ring_full_32   type numeric(6,4) using thumb_to_ring_full_32 / 32.0,
    alter column bridge_32               type numeric(6,4) using bridge_32 / 32.0;

alter table drill_sheet_revision rename column thumb_to_middle_fit_32  to thumb_to_middle_fit;
alter table drill_sheet_revision rename column thumb_to_middle_full_32 to thumb_to_middle_full;
alter table drill_sheet_revision rename column thumb_to_ring_fit_32    to thumb_to_ring_fit;
alter table drill_sheet_revision rename column thumb_to_ring_full_32   to thumb_to_ring_full;
alter table drill_sheet_revision rename column bridge_32               to bridge;

-- 0007's comment on the bridge column.
comment on column drill_sheet_revision.bridge is
    'Inches, edge-to-edge: the material between the middle and ring finger holes.';
