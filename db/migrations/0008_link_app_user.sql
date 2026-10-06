-- migrate:up

-- First sign-in: connect a Cognito login to the app_user that was created for
-- that person (by invitation, or the seed script for a company's owner).
--
-- Matches on email, case-insensitively, and only links a user that has no
-- Cognito login yet, so an already-linked account can never be taken over.
-- The API must only call this with the email from a verified Cognito token
-- (email_verified = true).
--
-- Runs as the table owner because no company is set before sign-in; returns
-- only what the API needs to set app.company_id.
create function link_app_user(p_cognito_sub text, p_email text)
returns table (user_id uuid, company_id uuid, active boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    return query
    update app_user u
    set cognito_sub = p_cognito_sub
    where lower(u.email) = lower(p_email)
      and u.cognito_sub is null
    returning u.id, u.company_id, u.active;
end;
$$;

revoke all on function link_app_user(text, text) from public;
grant execute on function link_app_user(text, text) to drilld_app;

-- migrate:down

drop function link_app_user(text, text);
