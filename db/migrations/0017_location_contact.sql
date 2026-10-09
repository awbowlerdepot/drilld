-- migrate:up

-- ==========================================
-- Location contact details for listings
-- ==========================================
-- What listing platforms (Google, Facebook, Apple, Yelp) show besides the
-- address, phone and hours. The address and hours stay jsonb, now
-- structured (shared/api/locationHours.ts); the old one-line address and
-- free-text hours are read and upgraded by the API.

alter table location add column email text check (length(email) <= 254);
alter table location add column website text check (length(website) <= 300);

-- migrate:down

alter table location drop column website;
alter table location drop column email;
