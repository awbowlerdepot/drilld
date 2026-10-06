# Drilld data model

Status: agreed design. The PostgreSQL schema is implemented in `db/migrations/`, tested by `db/test.sh`, and deployed per environment on Aurora Serverless v2 (see `db/README.md`); where this doc and the migrations differ, the migrations win. The API and services are not built yet. Last updated 2026-10-05.

## Decisions

| Topic | Decision |
|---|---|
| Tenant | **Company**, the paying customer. All tenant data carries `company_id`. |
| Physical shops | **Location**. A company has 1..n locations. In the UI it can be labelled "Pro Shop". |
| Users | Belong to exactly **one company**. Job roles (Manager, Senior Tech, Technician, Apprentice) are granted **per location**; optional company access (`OWNER`/`ADMIN`) covers every location. Permissions are derived from these roles, with no per-user permission lists. |
| Billing | **Company level**. A plan includes up to **4 locations**; more locations means a bigger plan (to be designed later). |
| Rollout | Used **internally first**, as the first company, then productized. Multi-tenancy is built in from day one so productizing needs no data migration. |
| Customers (bowlers) | Company level, with a home location. Shared across the company's locations. |
| Ball products | Come from the **BowlerIQ Partner API** (v1). Drilld keeps a local copy, synced from its change feed, and references it by BowlerIQ ball id + weight. |
| Physical balls | **Platform-wide registry** keyed on manufacturer + serial, so a ball can move between companies. |
| Cross-company ball info | **Option 2**: another company sees only anonymous facts (drill count, plug count, month last worked). |
| Drill sheets | The bowler's **fit**. Work orders point at the specific revision drilled. A sheet is **active or archived**; approval belongs to a **revision**; drilling progress belongs to the **work order**. |
| Revisions | **Drafts are editable** until the revision is approved or used on a work order; after that it's locked, and further changes start a new draft revision. |
| Approval | Records **who approved and when**; it's not a second-person check. Anyone who can edit drill sheets at that location may approve, the author included. Whether drilling requires an approved revision follows the **Require Supervisor Approval** workflow setting (company default, overridable per location). |
| Pitch | **Inches only** (forward, reverse, lateral). |
| Bridge | Measured **edge-to-edge**: the material left between the middle and ring finger holes. |
| Layouts | Per ball: the exact layout used is stored on the **work order**. Layouts can also be saved for reuse as **layout templates**, either a bowler's go-to or shop standards. A drilling starts from one and is then adjusted. |
| Storage of the spec | **Hybrid**: queryable measurements are real columns, and the full nested spec goes in `jsonb` with a schema version. |

## Overview

```
Platform
├── catalog_ball                  local copy of the BowlerIQ catalog (synced)
├── ball                          registry: identity only (catalog ref, weight, brand, serial)
├── ball_service_summary()        the only cross-company read path
└── company                       TENANT
    ├── location                  physical pro shop (plan includes up to 4)
    ├── app_user                  one company per person
    │   └── location_membership   role per location
    ├── customer                  bowler
    │   └── drill_sheet
    │       └── drill_sheet_revision   immutable fit spec
    ├── company_ball              this company's record of a registry ball
    │   └── ball_ownership        which customer owned it, and when
    └── work_order                at a location: ball + drill sheet revision + layout
```

## Units

- **Spans and bridge**: inches, `numeric(6,4)`. No floats. Bridge is always edge-to-edge.
- **Hole and bit sizes**: integer **64ths of an inch** (31/64" is stored as `31`, 1" as `64`). They are exact and sortable, and the UI renders them as fractions.
- **Pitch**: inches only, never degrees. `forward` is positive forward and negative reverse; `lateral` is positive right and negative left.
- **Weights**: ball weight in pounds, static weights (top, side, finger) in ounces, both `numeric(5,2)`.
- **Money**: `numeric(10,2)`.

Span types (fit, full, cut-to-cut) and bridge are separate measurements and are never stored in the same column.

## Tables

All tables have `id uuid primary key default gen_random_uuid()` and `created_at timestamptz not null default now()` unless noted. Tenant tables also have `updated_at`.

### Tenancy

```sql
create table plan (
    code                text primary key,          -- e.g. 'STANDARD'
    name                text not null,
    included_locations  int  not null default 4
);

create table company (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    plan_code       text not null references plan(code),
    billing_cycle   text check (billing_cycle in ('MONTHLY','YEARLY')),  -- null until billing exists
    billing_email   text,
    billing_address jsonb,
    settings        jsonb not null default '{}',    -- company-wide defaults
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table location (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    name               text not null,
    address            jsonb,
    phone              text,
    timezone           text not null,
    hours              jsonb,
    equipment          jsonb not null default '[]',  -- [{name, model, manufacturer, serialNumber, condition}]
    settings_overrides jsonb not null default '{}',  -- overrides company.settings
    active             boolean not null default true,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    unique (company_id, id)                          -- target for composite FKs
);

create table app_user (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references company(id),
    cognito_sub   text unique,                -- null until the person first signs in
    email         text not null unique,               -- one company per person
    first_name    text not null,
    last_name     text not null,
    phone         text,
    company_role  text check (company_role in ('OWNER','ADMIN')),  -- null = location roles only
    hire_date     date,
    hourly_rate   numeric(8,2),
    specialties   text[] not null default '{}',
    certifications jsonb not null default '{}',
    active        boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (company_id, id)
);

create table location_membership (
    company_id  uuid not null,
    user_id     uuid not null,
    location_id uuid not null,
    role        text not null check (role in ('MANAGER','SENIOR_TECH','TECHNICIAN','APPRENTICE')),
    primary key (user_id, location_id),
    foreign key (company_id, user_id)     references app_user(company_id, id),
    foreign key (company_id, location_id) references location(company_id, id)
);
```

**Location limit.** A trigger on `location` enforces it in the database. Creating or re-activating a location locks the company row (`select ... for update`), counts active locations and rejects the change if the count would exceed `plan.included_locations`.

### Customers

```sql
create table customer (
    id                    uuid primary key default gen_random_uuid(),
    company_id            uuid not null references company(id),
    home_location_id      uuid,
    first_name            text not null,
    last_name             text not null,
    email                 text,
    phone                 text,
    dominant_hand         text not null check (dominant_hand in ('LEFT','RIGHT')),
    preferred_grip_style  text not null check (preferred_grip_style in ('CONVENTIONAL','FINGERTIP','TWO_HANDED_NO_THUMB')),
    uses_thumb            boolean not null default true,
    notes                 text,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    unique (company_id, id),
    foreign key (company_id, home_location_id) references location(company_id, id)
);
```

### Ball catalog (BowlerIQ)

Ball products come from the **BowlerIQ Partner API v1**. The API docs and OpenAPI schema live in the `brunswick-scraper` repo: `docs/partner-api-v1.md` and `tests/fixtures/partner_api_v1_openapi.json`.

What matters for Drilld:

- **Base URL** `https://api.bowleriq.io/partner/`. Auth is `Authorization: Bearer <partner key>`.
  - The key is **server-side only**. It goes in AWS Secrets Manager, never in a `VITE_*` env var or the browser.
- **One ball id per colorway**, stable UUID. **Weights are not separate ids**: each ball has a `weights[]` list with RG, differential and mass bias per weight. So a ball product in Drilld is identified by **ball id + weight**.
- **Brands** have stable ids. A brand id is the "manufacturer" for serial-number uniqueness.
- **No per-serial data.** Pin distance, top weight and other per-ball measurements stay on `company_ball`.
- **No search endpoint.** Drilld searches its own copy when staff pick a ball.
- **v1 only grows.** New optional fields may appear, so store the whole object and ignore unknown fields.
- **Sync** uses `GET /v1/changes?cursor=…`:
  - Page until `has_more` is false, and save `next_cursor` after applying each page.
  - Each item is either `upsert` (replace our copy with the ball) or `remove` (no longer published).
  - Applying a page twice is safe.
  - The first run, with no cursor, returns every ball.
  - Run it every 15–60 minutes from a scheduled backend job (EventBridge + Lambda). The rate limit is about 10 requests/second.
- **Plotter data** (`/v1/plotter`, oil 1–16 and motion 1–18, plus similar balls) is available for future ball recommendation features. It's not used in v1 of Drilld.

```sql
-- Local copy of the BowlerIQ catalog. Platform data, not tenant data. Written only by the sync job.
create table catalog_ball (
    id                  uuid primary key,          -- BowlerIQ ball id (one per colorway)
    brand_id            uuid not null,             -- BowlerIQ brand id
    brand_name          text not null,
    name                text not null,
    color               text,
    status              text not null,             -- 'current' | 'retired' (retired is still valid)
    data                jsonb not null,            -- full BowlerIQ Ball object: weights, coverstock, core, plotter, urls
    content_changed_at  timestamptz not null,
    removed_at          timestamptz,               -- set on a 'remove' change; cleared by a later 'upsert'
    synced_at           timestamptz not null default now()
);
create index catalog_ball_search_idx on catalog_ball (brand_name, name);

-- Single row: where the change feed left off.
create table catalog_sync_state (
    id          smallint primary key default 1 check (id = 1),
    cursor      text,
    last_run_at timestamptz
);
```

A `remove` **never deletes** a `catalog_ball` row. It only sets `removed_at`. Physical balls and work orders may still reference the ball, and their history must stay intact. Removed balls are hidden when picking a new ball.

### Balls

```sql
-- Platform-wide registry of physical balls. NOT tenant data. Identity only.
create table ball (
    id               uuid primary key default gen_random_uuid(),
    catalog_ball_id  uuid not null references catalog_ball(id),
    weight_lbs       smallint not null,    -- picks the entry in catalog_ball.data.weights
    brand_id         uuid not null,        -- copied from catalog_ball for the serial constraint
    serial_number    text,                 -- normalized: trimmed, upper-cased
    created_at       timestamptz not null default now()
);
create unique index ball_brand_serial_uq
    on ball (brand_id, serial_number) where serial_number is not null;

-- A company's record of a physical ball.
create table company_ball (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references company(id),
    ball_id        uuid not null references ball(id),
    pin_distance   numeric(6,4),           -- inches, pin to CG, as recorded by this company
    top_weight     numeric(5,2),           -- ounces
    specs          jsonb not null default '{}',  -- other per-ball specs
    status         text not null check (status in ('ACTIVE','RETIRED','DAMAGED')),
    purchase_date  date,
    purchase_price numeric(10,2),
    notes          text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (company_id, ball_id),
    unique (company_id, id)
);

create table ball_ownership (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null,
    company_ball_id  uuid not null,
    customer_id      uuid not null,
    from_date        date not null,
    to_date          date,                 -- null = current owner
    foreign key (company_id, company_ball_id) references company_ball(company_id, id),
    foreign key (company_id, customer_id)     references customer(company_id, id)
);
create unique index ball_ownership_current_uq
    on ball_ownership (company_ball_id) where to_date is null;
```

**Registering a ball** goes through one backend path:

1. Staff pick a ball and a weight from `catalog_ball`.
2. The backend normalizes the serial.
3. It upserts into `ball` on (brand_id, serial).
4. It creates the `company_ball` and `ball_ownership` rows.

A ball without a serial always gets a new registry row.

### Drill sheets

A drill sheet is the **bowler's fit**: spans, bridge, holes, pitch, inserts, and the bowler's axis (PAP, tilt, rotation). Ball-specific layout lives on the work order.

```sql
create table drill_sheet (
    id                    uuid primary key default gen_random_uuid(),
    company_id            uuid not null references company(id),
    customer_id           uuid,                       -- null for templates
    name                  text not null,
    grip_style            text not null check (grip_style in ('CONVENTIONAL','FINGERTIP','TWO_HANDED_NO_THUMB')),
    is_template           boolean not null default false,
    based_on_template_id  uuid,
    current_revision_id   uuid,                       -- FK added after drill_sheet_revision
    archived_at           timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    unique (company_id, id),
    check (is_template or customer_id is not null),
    foreign key (company_id, customer_id) references customer(company_id, id)
);

create table drill_sheet_revision (
    id                    uuid primary key default gen_random_uuid(),
    company_id            uuid not null,
    drill_sheet_id        uuid not null,
    version               int  not null,
    location_id           uuid,                       -- where it was measured / created
    created_by_user_id    uuid not null,
    revision_notes        text,
    approved_by_user_id   uuid,
    approved_at           timestamptz,

    -- Promoted, queryable measurements (inches)
    thumb_to_middle_fit   numeric(6,4),
    thumb_to_middle_full  numeric(6,4),
    thumb_to_ring_fit     numeric(6,4),
    thumb_to_ring_full    numeric(6,4),
    bridge                numeric(6,4),
    -- Promoted hole sizes (64ths)
    thumb_size_64         smallint,
    middle_size_64        smallint,
    ring_size_64          smallint,

    -- Full spec
    spec                  jsonb not null,
    spec_schema_version   smallint not null,
    created_at            timestamptz not null default now(),

    unique (drill_sheet_id, version),
    unique (company_id, id),
    foreign key (company_id, drill_sheet_id) references drill_sheet(company_id, id),
    foreign key (company_id, location_id)    references location(company_id, id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

alter table drill_sheet
    add foreign key (company_id, current_revision_id) references drill_sheet_revision(company_id, id);
```

**Revision rules:**

- **New sheets start as drafts.** A new sheet, or a change to a locked revision, creates a **draft** revision (version n+1) and makes it the sheet's current revision.
- **Drafts are editable.** Saving a draft updates it in place.
- **A revision locks** when it's approved, or when a work order references it. From then on a trigger rejects every `UPDATE` and `DELETE`. Approval can be set once, on a draft. (Migration 0005 currently locks revisions on insert; see "Pending schema changes".)
- **Approval** sets `approved_by_user_id` and `approved_at`. Anyone with `write:drillsheets` at the revision's location can approve, the author included, as can company owners and admins. Under today's role permissions that means Technician and up; Apprentices can't.
- **Drilling to an unapproved revision** is rejected when the effective **Require Supervisor Approval** setting is on: the company setting, or the location's override (`resolveLocationSettings`). This is enforced in the API.
- **Promoted columns** are written from `spec` by the backend on every save. The backend validates `spec` against the schema for `spec_schema_version` with zod (a TypeScript validation library), on both write and read.

**`spec` contents** (version 1). Lengths are inches; sizes are 64ths:

```
{
  spans: {
    thumbToMiddle: { fit, full, cutToCut, notes },
    thumbToRing:   { fit, full, cutToCut, notes },
    custom: [ { name, from: 'THUMB'|'INDEX'|'MIDDLE'|'RING'|'PINKY', to: …, fit, full, cutToCut, notes } ]
  },
  bridge: { distance, notes },                 // edge-to-edge, middle ↔ ring
  holes: {
    thumb:  { enabled, shape: 'ROUND'|'OVAL', size64, ovalLength64?, depth,
              pitch, slug?, bevel?, drillingSequence?, notes },
    middle: { size64, depth, pitch, insert?, bevel?, drillingSequence?, notes },
    ring:   { …same as middle },
    index?: { …same as middle },
    pinky?: { …same as middle }
  },
  axis: { papHorizontal, papVertical, tilt, rotation },
  notes, customerPreferences, restrictions: []
}

pitch            = { forward, lateral }      // inches; negative forward = reverse, negative lateral = left
bevel            = { angleDegrees, depth }
drillingSequence = [ { step, bitSize64, depth, notes } ]   // in drilling order
slug             = { manufacturer, type, size64, tapered }
```

Inserts use one shape everywhere: `{ manufacturer: 'VISE'|'Turbo'|'JoPo'|'Other', insertSize64, outsideHole: '7/8'|'31/32'|'1-1/32', type, model, color }`. The current code has two insert definitions; this replaces both.

Reference data (insert size ranges, manufacturer product lines) stays in code, not in `spec`.

### Work orders

```sql
create table work_order (
    id                       uuid primary key default gen_random_uuid(),
    company_id               uuid not null,
    location_id              uuid not null,
    company_ball_id          uuid not null,
    customer_id              uuid not null,         -- owner at time of work
    drill_sheet_revision_id  uuid,                  -- null for surface/maintenance-only work
    work_type                text not null check (work_type in ('INITIAL_DRILL','PLUG_REDRILL','MAINTENANCE','SURFACE_ADJUSTMENT')),
    performed_by_user_id     uuid,
    work_date                date not null,
    started_at               timestamptz,
    ended_at                 timestamptz,
    labor_hours              numeric(5,2),
    labor_cost               numeric(10,2),
    materials_cost           numeric(10,2),
    total_cost               numeric(10,2),
    layout                   jsonb,                 -- see below
    deviations_from_spec     text,
    quality_check            boolean,
    quality_notes            text,
    customer_satisfaction    smallint check (customer_satisfaction between 1 and 5),
    warranty_days            int,
    notes                    text,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    foreign key (company_id, location_id)             references location(company_id, id),
    foreign key (company_id, company_ball_id)         references company_ball(company_id, id),
    foreign key (company_id, customer_id)             references customer(company_id, id),
    foreign key (company_id, drill_sheet_revision_id) references drill_sheet_revision(company_id, id),
    foreign key (company_id, performed_by_user_id)    references app_user(company_id, id)
);
```

**`layout`** (per ball, per drilling):

```
{
  system: 'DUAL_ANGLE' | 'VLS' | 'PIN_BUFFER' | 'OTHER',
  values: { ... },        // e.g. drillingAngle, pinToPap, valAngle / pinToPap, pinBuffer, ...
  cg:      { placement, distance },
  balanceHole: { size64, depth, position } | null,
  surface: { grit, finish, steps: [...] },
  layoutSchemaVersion: 1
}
```

Photos go in S3 with a `work_order_photo` table (`work_order_id`, `kind: BEFORE|AFTER`, `s3_key`).

### Layout templates

Reusable starting points for a work order's `layout`. A template is either **a bowler's go-to** (`customer_id` set) or a **shop standard** (`customer_id` null). Starting a drilling from one copies its layout onto the work order, where it can be adjusted. The work order keeps that copy, so editing or archiving a template never changes past work.

```sql
create table layout_template (
    id                 uuid primary key default gen_random_uuid(),
    company_id         uuid not null references company(id),
    customer_id        uuid,                  -- null = shop standard
    name               text not null,
    layout             jsonb not null,        -- same shape as work_order.layout, without balanceHole and surface (those are per ball)
    created_by_user_id uuid not null,
    archived_at        timestamptz,
    created_at, updated_at,
    unique (company_id, id),
    foreign key (company_id, customer_id)        references customer(company_id, id),
    foreign key (company_id, created_by_user_id) references app_user(company_id, id)
);

-- on work_order:
based_on_layout_template_id uuid,           -- which template the drilling started from, if any
foreign key (company_id, based_on_layout_template_id) references layout_template(company_id, id)
```

## Internal-first rollout

Build now (expensive to retrofit later):

- `company_id` on every tenant table, row-level security, composite foreign keys
- per-location memberships and roles
- the `plan` table and the location limit check
- the platform ball registry and `ball_service_summary`

Defer until productizing (it can be added without migrating data):

- self-service signup and company onboarding. For now, the internal company is created by a seed or admin script.
- payment provider integration and plan management UI. The billing columns stay null for the internal company.
- additional plans above 4 locations
- a platform admin console

## Sign-in (Cognito)

Defined in `amplify/auth/resource.ts` and `amplify/backend.ts`.

- **Email and password**, with optional authenticator-app (TOTP) MFA and email-only password recovery.
- **No self sign-up.** Accounts are created by invitation (Cognito `AdminCreateUser`), which emails a temporary password.
- **Cognito holds identity only.** Company, roles and permissions live in the database and are looked up by the Cognito `sub` through `resolve_app_user`. Nothing about tenancy is stored in Cognito attributes or groups.

**Invitation flow** (API work, not built yet):

1. An owner or admin adds an employee. The API creates the `app_user` row (with `cognito_sub` null) and calls `AdminCreateUser` with their email.
2. On first sign-in, `resolve_app_user(sub)` finds nothing. The API then matches the token's **verified** email to the `app_user` row, case-insensitively, and saves the `sub`.
3. That match needs a second narrow `SECURITY DEFINER` function, because no company is set yet.

The first company and its owner are created by a platform seed/admin script.

**Frontend:** `src/main.tsx` wraps the app in `AuthWrapper` (the Amplify `Authenticator` with sign-up hidden) when `amplify_outputs.json` has an `auth` section. Without it, the app runs without sign-in on mock data. Once hooks read real data, production must refuse to run without auth.

## Tenant isolation

1. **Row-level security** on every tenant table:
   ```sql
   alter table customer enable row level security;
   create policy tenant_isolation on customer
       using (company_id = current_setting('app.company_id')::uuid);
   ```
2. **The company comes from the server, never the client.** For each request, the backend calls `resolve_app_user(cognito_sub)`, a narrow `SECURITY DEFINER` lookup that works before any company is set. It then runs `set_config('app.company_id', ..., true)` inside the transaction.
3. **Composite foreign keys** `(company_id, x_id)` make it impossible for one company's row to reference another company's row, even through a bug.
4. **Location scope** is checked in the backend against `location_membership`. `OWNER` and `ADMIN` users have every location in their company.
5. The app's database role does **not** bypass RLS. Migrations use a separate owner role.

### The one cross-company read

```sql
create function ball_service_summary(p_ball_id uuid)
returns table (drill_count int, plug_count int, last_worked_month date)
language sql security definer set search_path = public as $$
    select
        count(*) filter (where wo.work_type = 'INITIAL_DRILL')::int,
        count(*) filter (where wo.work_type = 'PLUG_REDRILL')::int,
        date_trunc('month', max(wo.work_date))::date
    from work_order wo
    join company_ball cb on cb.id = wo.company_ball_id
    where cb.ball_id = p_ball_id;
$$;
```

It returns counts and a month only: no company, customer, location, spec or layout. It is calculated live, with no stored counters. The `ball` registry itself is readable by any authenticated user for serial lookup, and holds only identity fields.

## Prisma notes

Prisma models cover the tables and plain foreign keys. The following live in raw SQL migrations, because Prisma's schema can't express them:

- RLS policies
- partial unique indexes
- `ball_service_summary`
- the revision immutability trigger

Tenant-scoped Prisma queries run in an interactive transaction that sets `app.company_id` first.

## Mapping from the current frontend code

| Current | Becomes |
|---|---|
| `proshopID` (tenant) | `companyID` |
| `ProShopSettings` | `CompanySettings` (`company.settings`) + location overrides; billing moves to `company` |
| `Location` (with `proshopID`) | `Location` with `companyID`; `equipmentInfo.equipment` → `equipment` |
| `Employee` (single `role`, `locations[]`) | `AppUser` + `LocationMembership[]` (role per location) |
| `BowlingBall` (manufacturer/model/coverstock/core) | `CatalogBall` (BowlerIQ) + `Ball` (registry: catalog id, weight, serial) + `CompanyBall` + `BallOwnership` |
| `BowlingBall.drillSheetID` | removed; derived from the ball's latest work order |
| `DrillSheet` | `DrillSheet` + `DrillSheetRevision` (`spec` jsonb) |
| `DrillSheet.layout`, `additionalHoles`, `surface` | move to `WorkOrder.layout` |
| `HoleSize.primary` (`"31/64"`) | `size64` (`31`) |
| `HoleSize.insert` and `FingerHole.insert` | single `Insert` shape |
| `WorkOrder.drillSheetID`, `ballID`, `locationID` | `drillSheetRevisionID`, `companyBallID`, `locationID` |

## Pending schema changes

These decisions are agreed but not yet in `db/migrations`. They go in the next migration:

1. **Editable draft revisions.** Replace `protect_drill_sheet_revision`: allow `UPDATE` while `approved_at` is null and no `work_order` references the revision; otherwise reject. Approval stays a one-time update on a draft. `DELETE` remains blocked for all revisions.
2. **`layout_template` table** and `work_order.based_on_layout_template_id`, with row-level security and grants like the other tenant tables.
3. **Column comments:** the bridge is edge-to-edge, and pitch is in inches.

## Open items

1. **Customer sharing setting.** Do customers stay shared across all of a company's locations, or should there be a company-level toggle for chains that run locations independently?
