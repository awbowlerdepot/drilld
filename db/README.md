# Database

PostgreSQL schema for Drilld. The design and its reasoning are in [`docs/data-model.md`](../docs/data-model.md).

## Layout

- `migrations/` — plain SQL migrations in [dbmate](https://github.com/amacneil/dbmate) format: each file has a `-- migrate:up` section and a `-- migrate:down` section. They are applied in filename order.
- `tests/schema_test.sql` — checks for row-level security, constraints, triggers and grants.
- `test.sh` — runs the tests (see below).

The migrations are the source of truth for the schema. They use features an ORM's migration tool can't express: row-level security, partial unique indexes, triggers and a `SECURITY DEFINER` function. The API's query types are generated from them (`db/codegen.sh`); nothing generates migrations.

## Deployment (AWS)

Defined in `amplify/database/resource.ts`. Every Amplify environment gets its own cluster: the `main` branch (production) and each developer sandbox.

**The cluster:**
- Aurora PostgreSQL 16.8 Serverless v2.
- Scales to 0 and pauses when idle: after 30 minutes in production, 10 in a sandbox. The first request after a pause waits about 15 seconds.
- Runs in its own VPC with isolated subnets only: no NAT gateway, no internet access, not publicly reachable.
- The RDS Data API is enabled, so Lambdas reach it over HTTPS with IAM and a Secrets Manager secret, and don't need to run inside the VPC.

**Production** has deletion protection and 14-day backups. A final snapshot is kept, along with the login secrets, if its stack is ever removed. **Sandboxes** are disposable: `npx ampx sandbox delete` removes the database.

**Migrations run on every deploy that changes `db/migrations/`.** A CloudFormation custom resource (`amplify/database/migrate-handler.ts`):
1. Applies pending migrations through the Data API, one transaction per migration, one statement per call. The splitter is in `amplify/database/sql.ts`.
2. Records each one in dbmate's `schema_migrations` table.
3. Creates or updates the login users from their secrets.

A failed migration rolls back and fails the deploy.

| Login user | Member of | Secret |
|---|---|---|
| `drilld_admin` | (cluster admin; owns the schema, runs migrations) | the cluster's generated secret |
| `drilld_api` | `drilld_app` | `ApiUserSecret` |
| `drilld_catalog_sync_job` | `drilld_catalog_sync` | `CatalogSyncUserSecret` |

## Kysely types

```bash
db/codegen.sh
```

Applies the migrations to a throwaway Postgres and writes the Kysely table types to `amplify/api/db/schema.ts`. Run it after adding a migration and commit the result. CI fails if the file is stale.

## Creating a company

Companies are created by the platform, not through the API:

```bash
npx tsx db/scripts/create-company.ts --stack <database stack> --company "Name" --location "Main" --timezone America/Denver --owner-email owner@example.com --owner-first Pat --owner-last Owner
```

This creates the company, its first location and its owner (`OWNER`, and also Manager at that location), all in one transaction. The owner's Cognito login is linked on first sign-in with that email.

## Testing

```bash
db/test.sh
```

Requires Docker and `node_modules` (`npm ci`). The script:

1. Starts a throwaway `postgres:16` container.
2. Applies every migration up, then down in reverse, then up again. The second "up" runs one statement per call through the same splitter the deploy uses, so a splitting bug fails the test.
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
