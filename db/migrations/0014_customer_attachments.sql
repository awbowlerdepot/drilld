-- migrate:up

-- ==========================================
-- Customer attachments
-- ==========================================
-- Files kept on a bowler's profile, mainly photos and scans of their paper
-- drill sheets, so moving a shop's binders into Drilld starts with a picture.
-- The file itself is in the company's prefix of the private files bucket
-- (storage_key); the API hands out short-lived upload and view URLs.
-- A row starts with uploaded = false and is confirmed once the file is there.

create table customer_attachment (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    customer_id        uuid not null,
    storage_key        text not null unique,
    file_name          text not null check (length(file_name) between 1 and 255),
    content_type       text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
    size_bytes         bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
    kind               text not null default 'DRILL_SHEET' check (kind in ('DRILL_SHEET', 'OTHER')),
    label              text check (length(label) <= 200),
    -- Photos of paper are often sideways: how far to turn it to read it.
    rotation           smallint not null default 0 check (rotation in (0, 90, 180, 270)),
    uploaded           boolean not null default false,
    created_by_user_id uuid not null,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, customer_id) references customer(company_id, id) on delete cascade,
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

create index customer_attachment_customer_idx on customer_attachment (customer_id, created_at);

create trigger customer_attachment_set_updated_at before update on customer_attachment
    for each row execute function set_updated_at();

grant select, insert, update, delete on customer_attachment to drilld_app;
alter table customer_attachment enable row level security;
create policy tenant_isolation on customer_attachment
    using (company_id = app_company_id())
    with check (company_id = app_company_id());

comment on table customer_attachment is
    'Files on a customer''s profile (paper drill sheet photos and scans). The bytes are in S3 at storage_key.';

-- migrate:down

drop table customer_attachment;
