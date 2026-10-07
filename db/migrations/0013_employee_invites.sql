-- migrate:up

-- ==========================================
-- Employee management
-- ==========================================
-- Employees are invited by email (Cognito AdminCreateUser). invited_at is when
-- the last invitation went out; a user with no cognito_sub hasn't signed in
-- yet. Certifications were an undefined free-form blob and are dropped until
-- they're designed.

alter table app_user add column invited_at timestamptz;
alter table app_user drop column certifications;

comment on column app_user.invited_at is
    'When the last invitation email was sent. Null for users created by the seed script.';

-- migrate:down

alter table app_user add column certifications jsonb not null default '{}';
alter table app_user drop column invited_at;
