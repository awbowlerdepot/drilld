-- migrate:up

-- ==========================================
-- Who last saved a revision
-- ==========================================
-- A draft is edited in place, so created_by_user_id isn't enough to say who
-- made its current content. The API sets this on every save. Existing
-- revisions get their author (the protect trigger is paused for the backfill,
-- since approved and drilled revisions can't otherwise change).

alter table drill_sheet_revision add column updated_by_user_id uuid;
alter table drill_sheet_revision
    add constraint drill_sheet_revision_updated_by_fk
    foreign key (company_id, updated_by_user_id) references app_user(company_id, id);

alter table drill_sheet_revision disable trigger drill_sheet_revision_protect;
alter table drill_sheet_revision disable trigger drill_sheet_revision_set_updated_at;
update drill_sheet_revision set updated_by_user_id = created_by_user_id;
alter table drill_sheet_revision enable trigger drill_sheet_revision_set_updated_at;
alter table drill_sheet_revision enable trigger drill_sheet_revision_protect;

comment on column drill_sheet_revision.updated_by_user_id is
    'Who last saved this revision (a draft is edited in place).';

-- migrate:down

alter table drill_sheet_revision drop constraint drill_sheet_revision_updated_by_fk;
alter table drill_sheet_revision drop column updated_by_user_id;
