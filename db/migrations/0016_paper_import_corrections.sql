-- migrate:up

-- ==========================================
-- Paper import corrections
-- ==========================================
-- What the reviewer corrected in the AI's transcription before importing
-- (e.g. read "13/16", the sheet says "15/16"). One shop's sheets were usually
-- filled in by the same person, so a company's past corrections are passed to
-- the reader as hints for its later imports.

alter table paper_import add column corrected_reading jsonb;

comment on column paper_import.corrected_reading is
    'The transcription as the reviewer corrected it; differences from reading become hints for this company''s later imports.';

create index paper_import_corrections_idx on paper_import (company_id, imported_at)
    where corrected_reading is not null;

-- migrate:down

drop index paper_import_corrections_idx;
alter table paper_import drop column corrected_reading;
