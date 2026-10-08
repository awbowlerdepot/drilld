-- migrate:up

-- ==========================================
-- Paper drill sheet imports
-- ==========================================
-- One row per uploaded page (photo, scan or PDF) of a paper drill sheet. The
-- page is read by an AI model into `reading` (a transcription of what's
-- written, shared/api/paperReading.ts); a person reviews it, picks or creates
-- the customer, and imports it: the page becomes a customer attachment and
-- the values a draft drill sheet. Nothing is created without that review.
--
-- `span_type` is what the reviewer said the sheet's unlabeled spans were;
-- later imports of the same template default to the company's last choice.
-- `imported_spec` keeps the spec as imported, so what was corrected before
-- approval can be learned from (per company: one shop's handwriting is
-- consistent, another's differs).

create table paper_import (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references company(id),
    location_id         uuid,
    storage_key         text not null unique,
    file_name           text not null check (length(file_name) between 1 and 255),
    content_type        text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
    size_bytes          bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
    status              text not null default 'UPLOADING'
                        check (status in ('UPLOADING', 'READING', 'READ', 'FAILED', 'IMPORTED', 'DISCARDED')),
    reading             jsonb,
    template            text,
    reader_model        text,
    error               text,
    read_at             timestamptz,
    span_type           text check (span_type in ('full32', 'cutToCut32', 'outerToCut32', 'centerToCenter32', 'fit32')),
    customer_id         uuid,
    attachment_id       uuid,
    drill_sheet_id      uuid,
    imported_spec       jsonb,
    imported_at         timestamptz,
    created_by_user_id  uuid not null,
    imported_by_user_id uuid,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, location_id) references location(company_id, id),
    foreign key (company_id, customer_id) references customer(company_id, id) on delete set null (customer_id),
    foreign key (company_id, attachment_id) references customer_attachment(company_id, id) on delete set null (attachment_id),
    foreign key (company_id, drill_sheet_id) references drill_sheet(company_id, id) on delete set null (drill_sheet_id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id),
    foreign key (company_id, imported_by_user_id) references app_user(company_id, id),
    check (status <> 'IMPORTED' or imported_at is not null)
);

create index paper_import_open_idx on paper_import (company_id, created_at)
    where status in ('UPLOADING', 'READING', 'READ', 'FAILED');
create index paper_import_template_idx on paper_import (company_id, template, imported_at)
    where status = 'IMPORTED';

create trigger paper_import_set_updated_at before update on paper_import
    for each row execute function set_updated_at();

grant select, insert, update, delete on paper_import to drilld_app;
alter table paper_import enable row level security;
create policy tenant_isolation on paper_import
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

comment on table paper_import is
    'A page of a paper drill sheet being imported: AI reading, review, then a customer attachment and a draft drill sheet.';

-- migrate:down

drop table paper_import;
