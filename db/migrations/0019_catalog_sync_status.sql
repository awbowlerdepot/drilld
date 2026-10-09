-- migrate:up

-- The app shows when the ball catalog last synced from BowlerIQ.
grant select on catalog_sync_state to drilld_app;

-- migrate:down

revoke select on catalog_sync_state from drilld_app;
