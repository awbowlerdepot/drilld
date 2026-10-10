-- migrate:up

-- ==========================================
-- A ball's drilling records the drill sheet revision it was drilled to
-- ==========================================
-- The holes on a ball come from a drill sheet; a bowler can have several (a
-- sheet with a thumb and a two-handed one for a spare ball). Each drilling
-- (ball_layout) records the exact revision drilled, and that revision locks
-- like one used on a work order: drafts are editable until approved or
-- drilled, and a later change starts a new revision.

alter table ball_layout add column drill_sheet_revision_id uuid;
alter table ball_layout add constraint ball_layout_drill_sheet_revision_fk
    foreign key (company_id, drill_sheet_revision_id) references drill_sheet_revision(company_id, id);
create index ball_layout_drill_sheet_revision_idx on ball_layout (drill_sheet_revision_id) where drill_sheet_revision_id is not null;

create or replace function protect_drill_sheet_revision() returns trigger
language plpgsql as $$
begin
    if tg_op = 'DELETE' then
        raise exception 'Drill sheet revisions cannot be deleted'
            using errcode = 'restrict_violation';
    end if;

    if old.approved_at is not null then
        raise exception 'Drill sheet revision % is approved and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    if new.company_id is distinct from old.company_id
       or new.drill_sheet_id is distinct from old.drill_sheet_id
       or new.version is distinct from old.version
       or new.created_by_user_id is distinct from old.created_by_user_id
       or new.created_at is distinct from old.created_at then
        raise exception 'A revision''s sheet, version, author and creation time cannot change'
            using errcode = 'restrict_violation';
    end if;

    -- Drilled (used on a work order, or a ball's drilling): only approval may still be recorded.
    if (exists (select from work_order where drill_sheet_revision_id = old.id)
        or exists (select from ball_layout where drill_sheet_revision_id = old.id))
       and (to_jsonb(new) - 'approved_at' - 'approved_by_user_id' - 'updated_at')
           is distinct from (to_jsonb(old) - 'approved_at' - 'approved_by_user_id' - 'updated_at') then
        raise exception 'Drill sheet revision % has been drilled and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    return new;
end;
$$;

-- migrate:down

create or replace function protect_drill_sheet_revision() returns trigger
language plpgsql as $$
begin
    if tg_op = 'DELETE' then
        raise exception 'Drill sheet revisions cannot be deleted'
            using errcode = 'restrict_violation';
    end if;

    if old.approved_at is not null then
        raise exception 'Drill sheet revision % is approved and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    if new.company_id is distinct from old.company_id
       or new.drill_sheet_id is distinct from old.drill_sheet_id
       or new.version is distinct from old.version
       or new.created_by_user_id is distinct from old.created_by_user_id
       or new.created_at is distinct from old.created_at then
        raise exception 'A revision''s sheet, version, author and creation time cannot change'
            using errcode = 'restrict_violation';
    end if;

    -- Used on a work order: only approval may still be recorded.
    if exists (select from work_order where drill_sheet_revision_id = old.id)
       and (to_jsonb(new) - 'approved_at' - 'approved_by_user_id' - 'updated_at')
           is distinct from (to_jsonb(old) - 'approved_at' - 'approved_by_user_id' - 'updated_at') then
        raise exception 'Drill sheet revision % has been drilled and cannot change; save a new revision instead', old.id
            using errcode = 'restrict_violation';
    end if;

    return new;
end;
$$;

drop index ball_layout_drill_sheet_revision_idx;
alter table ball_layout drop constraint ball_layout_drill_sheet_revision_fk;
alter table ball_layout drop column drill_sheet_revision_id;
