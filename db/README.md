# Database

PostgreSQL schema for Drilld. The design and its reasoning are in [`docs/data-model.md`](../docs/data-model.md).

## Layout

- `migrations/` — plain SQL migrations in [dbmate](https://github.com/amacneil/dbmate) format: each file has a `-- migrate:up` section and a `-- migrate:down` section. They are applied in filename order.
- `tests/schema_test.sql` — checks for row-level security, constraints, triggers and grants.
- `test.sh` — runs the tests (see below).

The migrations are the source of truth for the schema. They use features an ORM's migration tool can't express: row-level security, partial unique indexes, triggers and a `SECURITY DEFINER` function. A query client such as Prisma can introspect the schema, but must not generate migrations.

## Testing

```bash
db/test.sh
```

Requires Docker. The script:

1. Starts a throwaway `postgres:16` container.
2. Applies every migration up, then down in reverse, then up again.
3. Runs the schema tests.

It exits non-zero on the first failure, and the container is removed afterwards.

## Roles

Migrations create two group roles (`NOLOGIN`). Infrastructure creates the login users and grants them membership.

| Role | Used by | Access |
|---|---|---|
| table owner | migrations | Everything. Not a superuser, and never used by the running app. |
| `drilld_app` | the API | Tenant tables, under row-level security. Read-only on `plan`, `catalog_ball` and `ball` (it can also insert into `ball`). |
| `drilld_catalog_sync` | BowlerIQ sync job | Read and write on `catalog_ball` and `catalog_sync_state` only. No tenant data. |

## How the API must use it

1. **Find the user.** On each request, look up the signed-in user:

   ```sql
   select * from resolve_app_user(:cognito_sub);
   ```

   This works before any company is set.
2. **Set the company.** In every transaction, set it from that result, never from client input:

   ```sql
   select set_config('app.company_id', :company_id, true);
   ```

   With no company set, tenant tables return no rows and reject writes.
3. **Check location scope in the API.** Row-level security only isolates companies. Whether a user may act at a particular location comes from `location_membership`.
