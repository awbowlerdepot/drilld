# Drilld data model

Status: agreed design. The PostgreSQL schema is implemented in `db/migrations/`, tested by `db/test.sh`, and deployed per environment on Aurora Serverless v2 (see `db/README.md`); where this doc and the migrations differ, the migrations win. The API and services are not built yet. Last updated 2026-10-06.

## Decisions

| Topic | Decision |
|---|---|
| Tenant | **Company**, the paying customer. All tenant data carries `company_id`. |
| Physical shops | **Location**. A company has 1..n locations. In the UI it can be labelled "Pro Shop". |
| Users | Belong to exactly **one company**. Job roles (Manager, Senior Tech, Technician, Apprentice) are granted **per location**; optional company access (`OWNER`/`ADMIN`) covers every location. Permissions are derived from these roles, with no per-user permission lists. |
| Billing | **Company level**. A plan includes up to **4 locations**; more locations means a bigger plan (to be designed later). |
| Rollout | Used **internally first**, as the first company, then productized. Multi-tenancy is built in from day one so productizing needs no data migration. |
| Customers (bowlers) | Company level, with a home location. Shared across the company's locations. |
| Grips and thumb hardware | A **platform-wide catalog** of manufacturer lines (VISE, Turbo, JoPo) and their sizes, each size with its fixed O.D. Each **location picks the lines and sizes it carries**. A drill sheet copies the chosen insert, which sets the hole's O.D. **Color is picked on the work order**, not on the drill sheet. |
| Ball products | Come from the **BowlerIQ Partner API** (v1). Drilld keeps a local copy, synced from its change feed, and references it by BowlerIQ ball id + weight. |
| Physical balls | **Platform-wide registry** keyed on manufacturer + serial, so a ball can move between companies. |
| Cross-company ball info | **Option 2**: another company sees only anonymous facts (drill count, plug count, month last worked). |
| Drill sheets | The bowler's **fit**. Work orders point at the specific revision drilled. A sheet is **active or archived**; approval belongs to a **revision**; drilling progress belongs to the **work order**. |
| Revisions | **Drafts are editable** until the revision is approved or used on a work order; after that it's locked, and further changes start a new draft revision. |
| Approval | Records **who approved and when**; it's not a second-person check. Anyone who can edit drill sheets at that location may approve, the author included. Whether drilling requires an approved revision follows the **Require Supervisor Approval** workflow setting (company default, overridable per location). |
| Pitch | **Inches only** (forward, reverse, lateral). |
| Precision | Spans, bridge and pitch are measured in **16ths**, with "+" adding 1/32 (`4-3/8″+` = 4-13/32″), and stored as whole **32nds**. Drill bit and hole sizes are **64ths**. Cuts are **decimal inches** (one standard cut is .032″). |
| Span types | **Full**, **cut-to-cut**, **outer-to-cut**, **center-to-center** and **fit** are separate measurements, each recorded as entered. They are never converted into one another automatically: spans run over a sphere between pitched holes. |
| Delivery | The customer holds the bowler's **current** delivery (tilt, rotation, PAP, speed, rev rate). Each drill sheet revision keeps a **copy** as of that fitting. |
| Pro Fit | A per-revision flag meaning the fit deliberately breaks the norms. It suppresses norm warnings (e.g. flexibility outside 70–135°) and suggested starting pitch. |
| CLT | Recorded in **degrees**. It's off by default (company setting `drillSheets.enableClt`), since the first company doesn't use it. When enabled, Auto-CLT **suggests** the fingers' lateral pitch from the CLT chart; the lateral pitch stored on each hole is what gets drilled. |
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

- **Spans, bridge and pitch**: integer **32nds of an inch** (`4-3/8″+` = 4-13/32″ is stored as `141`). Shops measure in 16ths and write "+" for an extra 1/32; the UI renders `141` back as `4-3/8″+`. Bridge is always edge-to-edge.
- **Hole and bit sizes**: integer **64ths of an inch** (31/64″ is stored as `31`, 1″ as `64`). Every drill bit size uses 64ths: hole sizes, O.D., pilot holes, step drilling. They are exact and sortable, and the UI renders them as fractions. The bit picker offers the bits a shop has (`src/utils/DrillBits.ts`):
  - Standard: 1/2″ through 1-1/8″ in 1/64″ steps, plus 1-1/4″, 1-3/8″ and 1-1/2″.
  - Interchangeable thumb hardware, each bit with a preset collar: VISE IT 1-3/16″, 1-5/16″, 1-7/16″ and 1-9/16″, and JoPo and Turbo 1-1/2″.
- **Ovals**: measured with bits, so every oval dimension is in 64ths. The cuts are calculated from them and never entered (see the spec below). One standard cut is 1/32″, or "2 bits" (.032″). Calculated readouts are shown in decimal inches to the thousandth.
- **Pitch**: inches only, never degrees. `forward` is positive forward and negative reverse; `lateral` is positive right and negative left.
- **Angles**: degrees (flexibility, CLT, thumb oval angle, bevel, axis tilt and rotation).
- **Delivery**: speed in mph (`numeric(4,1)`), rev rate in RPM (integer). PAP in 32nds of an inch: over from the center line, and up (negative = down).
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
    -- Current delivery (0009). Each drill sheet revision keeps a copy in spec.delivery.
    axis_tilt_degrees     numeric(4,1) check (axis_tilt_degrees between 0 and 90),
    axis_rotation_degrees numeric(4,1) check (axis_rotation_degrees between 0 and 90),
    pap_over_32           smallint check (pap_over_32 >= 0),
    pap_up_32             smallint,                   -- negative = down
    speed_mph             numeric(4,1) check (speed_mph > 0),
    rev_rate_rpm          smallint check (rev_rate_rpm > 0),
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

### Grip catalog (inserts and thumb hardware)

Finger inserts, thumb inserts, thumb slugs and interchangeable thumb systems come from three manufacturers: VISE, Turbo and JoPo. They're platform data, maintained by us and shared by every company, in the same way as the ball catalog. Each location says what it carries. Sources: VISE's 2026 order form, Turbo's finger insert chart and product pages, and JoPo's order lists.

**One size scale.** All three manufacturers size finger inserts on the same scale. VISE and Turbo number them: size *n* = (36 + 2*n*)/64″, so −1 = 17/32″, 0 = 9/16″, 8 = 13/16″ and 11 = 29/32″. JoPo writes the fraction. The catalog stores every size in 64ths, plus the manufacturer's own label.

**The O.D. comes from the insert.**

| Kind | O.D. (drilled hole) | Sizes |
|---|---|---|
| Standard finger inserts (VISE P/O, P/S, O/PO, Grape, Blue Silicone; Turbo Quad, Classic, Classic Pro, Quad 2, Power-SB; JoPo Power Flat/Oval, Oval/Oval Dots) | 31/32″ up to 13/16″; 1-1/32″ from 53/64″ | VISE to 29/32″; Turbo to 29/32″ (no 9.5/10.5); JoPo 19/32″–13/16″ |
| 7/8″ O.D. finger lines (VISE P/O, P/S, O/PO 7/8″; Turbo Ms. Quad) | 7/8″ | 17/32″–3/4″ (VISE P/S and O/PO to 49/64″) |
| Thumb inserts (VISE Pro V2, Tapered Oval/Round; Turbo Xcel) | 1-1/8″ for 51/64″–63/64″ (Xcel to 61/64″); 1-1/4″ for 1″–1-7/64″ (Xcel 31/32″–1-1/16″) | |
| Thumb slugs and solids (VISE, Turbo urethane, JoPo) | the slug size: 1-1/8″, 1-1/4″, 1-3/8″, 1-1/2″ | |
| Interchangeable thumb (VISE IT, Turbo Switch Grip / NX, JoPo Twist) | a **collar bit**: VISE IT slug + 1/16″ (1-3/16″, 1-5/16″, 1-7/16″, 1-9/16″); Switch Grip and Twist 1-1/2″ | |

```sql
-- Platform data: no company_id, read-only to the API (drilld_app has select only).
create table grip_line (
    id            uuid primary key default gen_random_uuid(),
    manufacturer  text not null check (manufacturer in ('VISE', 'TURBO', 'JOPO')),
    name          text not null,               -- 'P/O Power Lift & Oval', 'Quad', 'Twist'
    kind          text not null check (kind in ('FINGER_INSERT', 'FINGER_SLUG', 'THUMB_INSERT', 'THUMB_SLUG', 'INTERCHANGEABLE_THUMB')),
    colors        text[] not null default '{}', -- picked on the work order
    install_styles text[] not null default '{}', -- ways the insert installs, picked on the drill sheet
    active        boolean not null default true,
    unique (manufacturer, name)
);

create table grip_size (
    id            uuid primary key default gen_random_uuid(),
    line_id       uuid not null references grip_line(id),
    size64        smallint not null,           -- grip size (finger/thumb hole), or slug size
    label         text not null,               -- the manufacturer's label: '8.5', '61', '1/6', '13/16'
    od64_choices  smallint[] not null,         -- the O.D. bit(s); the first is the default
    collar        boolean not null default false,  -- drilled with a preset-collar hardware bit
    unique (line_id, size64)
);

-- Tenant data: what a location carries, by line and size (no color).
create table location_grip_stock (
    company_id    uuid not null,
    location_id   uuid not null,
    grip_size_id  uuid not null references grip_size(id),
    primary key (location_id, grip_size_id),
    foreign key (company_id, location_id) references location(company_id, id)
);
```

- **Seeding.** The catalog is seeded and updated by migrations, so it's versioned with the code. Migration `0010` creates it. The rows are generated by `db/seed/grip_catalog.py`, which encodes the sizing rules, so change the script and generate a new migration rather than editing rows by hand.
- **Location setup.** The person setting up a location picks the lines it carries. Picking a line checks all its sizes, which can then be unchecked. A location that carries nothing yet sees the whole catalog.
- **On the drill sheet,** choosing a finger insert lists the lines and sizes the location carries, with a "show all" for special orders. The choice is copied into the spec (below), so the sheet still reads correctly if the catalog changes. It also sets the hole's O.D. **Install style.** Many inserts install more than one way, and the drill sheet records which. VISE P/O installs as Power Lift or Oval, P/S as Power Lift or Semi, O/PO as Oval or Power Lift Oval. JoPo Power Flat / Oval and Oval / Oval Dots work the same way.
- **"Other".** An insert that isn't in the catalog can be entered by hand (manufacturer, name, size, O.D.).
- **Colors** are chosen per hole on the work order, from the line's colors, so the right colors get installed. That part of the work order design is still to do.
- **Thumb inners** for interchangeable systems: VISE IT slugs, Switch Grip inners, Twist inners.
  - The drill sheet's thumb hole spec is what gets drilled into an inner. Like color, the inner is chosen on the work order, not on the drill sheet.
  - A bowler can own many inners: different sizes, or several the same. Each one records how it was made, so it can be made again when the bowler asks for "the one you made before".

```sql
-- Tenant data: one row per inner made. Inners belong to the bowler, not to a ball,
-- because they move between the bowler's balls.
create table thumb_inner (
    id                      uuid primary key default gen_random_uuid(),
    company_id              uuid not null,
    customer_id             uuid not null,
    grip_line_id            uuid references grip_line(id),   -- the system: VISE IT, Switch Grip, Twist
    grip_size_id            uuid references grip_size(id),   -- the inner it started from (blank or pre-sized), if catalogued
    color                   text,
    label                   text,                  -- what the bowler calls it: "tight", "#3"
    made_on_work_order_id   uuid,                  -- the work order that made it
    drill_sheet_revision_id uuid,                  -- the spec it was drilled to
    made                    jsonb not null,        -- the process as made (below)
    made_at                 timestamptz not null default now(),
    retired_at              timestamptz,           -- worn out or lost
    foreign key (company_id, customer_id) references customer(company_id, id)
);
```

  - **`made` records the process** as it was actually drilled, including any change from the drill sheet:
    - the bits in drilling order
    - the hole size
    - the oval's pilot, width and **angle**
    - the number of cuts, each with its readout position
    - the pitch **within the inner** (below)
    - the bevel
    - notes

    A repeat order starts a new work order from it.
  - **Pitch within the inner.** The ball's thumb pitch is set when the outer piece is drilled. The inner's pitch is measured from the inner's center: 0 × 0 is the pitch center, and the default.
    - It can be offset (forward/reverse and lateral, in 32nds) to add some pitch in the inner.
    - **The 1/8″ wall rule.** The hole has to leave at least 1/8″ of wall all the way around:
      - farthest hole edge (the hole radius, or the oval's half-length along its angle) + offset ≤ inner diameter ÷ 2 − 1/8″
      - The inner's diameter is its catalog size (`grip_size.size64`, e.g. a 1-1/4″ inner or IT slug).
    - When a hole or offset breaks the rule, the shop's rule of thumb is to go up an inner size. The editor warns and suggests the next size up in that system.

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

A drill sheet is the **bowler's fit**: spans, bridge, holes, pitch, inserts, plus the bowler's delivery as of the fitting. Ball-specific layout lives on the work order.

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

    -- Promoted, queryable measurements (32nds of an inch; 0009).
    -- One column per span type, for thumb–middle and thumb–ring.
    thumb_to_middle_full_32   smallint,    -- gripping edge to gripping edge
    thumb_to_middle_cut_32    smallint,    -- drilled edge to drilled edge, before hardware
    thumb_to_middle_outer_32  smallint,    -- outer thumb hardware edge (no inner) to finger drilled edge
    thumb_to_middle_ctc_32    smallint,    -- center to center (CAD/CNC)
    thumb_to_middle_fit_32    smallint,    -- center of finger hole to cut edge of thumb
    thumb_to_ring_…_32        smallint,    -- same five for the ring finger
    bridge_32             smallint,       -- edge-to-edge
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
- **A revision locks** when it's approved, or when a work order references it. From then on a trigger rejects every `UPDATE` and `DELETE`. Approval can be set once on any unapproved revision, even one already drilled, since it only records who signed off. A revision's sheet, version, author and creation time never change. (Migration `0007`.)
- **Approval** sets `approved_by_user_id` and `approved_at`. Anyone with `write:drillsheets` at the revision's location can approve, the author included, as can company owners and admins. Under today's role permissions that means Technician and up; Apprentices can't.
- **Drilling to an unapproved revision** is rejected when the effective **Require Supervisor Approval** setting is on: the company setting, or the location's override (`resolveLocationSettings`). This is enforced in the API.
- **Promoted columns** are written from `spec` by the backend on every save. The backend validates `spec` against the schema for `spec_schema_version` with zod (a TypeScript validation library), on both write and read.

**`spec` contents** (version 1). Spans, bridge and pitch are 32nds; drill bit sizes are 64ths; cuts and widths are thousandths of an inch; angles are degrees:

```
{
  spans: {
    thumbToMiddle: span,
    thumbToRing:   span,
    custom: [ { name, from: 'THUMB'|'INDEX'|'MIDDLE'|'RING'|'PINKY', to: …, …span } ]
  },
  bridge: { distance32, notes },               // edge-to-edge, middle ↔ ring
  holes: {
    thumb:  { enabled, size64, outsideDiameter64?, depth32?, pitch,
              oval?, hardware?, bevel?, drillingSequence?, notes },
    middle: { size64, outsideDiameter64?, depth32?, pitch, insert?, vacu?, fingerOval?, bevel?, drillingSequence?, notes },
    ring:   { …same as middle },
    index?: { …same as middle },
    pinky?: { …same as middle }
  },
  fitting: { flexibilityDegrees?, proFit, cltDegrees? },
  delivery: { tilt, rotation, papOver32, papUp32, speedMph, revRateRpm },   // copy of the customer's, at this fitting
  fittingNotes, notes, customerPreferences, restrictions: []
}

span             = { full32?, cutToCut32?, outerToCut32?, centerToCenter32?, fit32?, notes }
pitch            = { forward32, lateral32 }  // negative forward = reverse, negative lateral = left
oval             = { angleDegrees, pilotHole64, width64 }   // thumb cuts are derived, not stored
fingerOval       = { width64 }                            // bit that fits the hole across; size64 is the pilot and sets the height
slug             = { manufacturer, type, size64, interchangeable, notes }
bevel            = { angleDegrees, depth32 }
drillingSequence = [ { step, bitSize64, depth32, notes } ]   // in drilling order
```

- **Left and right holes.** The middle finger is the left hole for a right-hander and the right hole for a left-hander. The spec stores fingers by name (`middle`, `ring`); the editor mirrors the layout by the customer's dominant hand.
- **O.D.** (`outsideDiameter64`) is the outer hole drilled for an insert or slug; `size64` is the grip hole inside it.
- **Thumb oval cuts are calculated.** After drilling, the shop measures the oval with two bits: one that fits the narrow side (`pilotHole64`) and one that fits the wide side (`width64`). It also measures the angle. The cuts are derived from these:
  - The elongation is `width64 − pilotHole64`. It is split evenly on both sides of the pilot hole's center, so each side gets half.
  - The center is the thumb's desired pitch: the pilot is drilled there.
  - Order matters: cuts **start at the top**. For a right-hander (oval up-left to down-right), start at the farthest up-and-left position, work back to the center, then out to the farthest down-and-right. For a left-hander (oval up-right to down-left), start at the farthest up-and-right and finish at the farthest down-and-left.
  - Each side is divided into equal cuts of **no more than 1/32″**: `n = ceil(side ÷ 1/32″)` cuts of `side ÷ n` each. Both sides get the same number of cuts.
  - The angle is measured from horizontal: 0° is a left-to-right oval and 90° is up-and-down. It mirrors with the hand. For a right-hander the oval tilts from up-left to down-right; for a left-hander the same angle tilts from up-right to down-left. The sheet records the same number either way, and the bowler's dominant hand sets the direction. Each cut's horizontal and vertical components are `cut × cos(angle)` and `cut × sin(angle)`. For example, one 1/32″ cut at 45° is about .022″ each way.
  - The editor and the drill press view list the calculated cuts in drilling order, as **digital readout positions**, rounded to thousandths:
    - The pitch center comes from the thumb's pitches. Forward/reverse pitch is on the vertical axis and lateral on the horizontal; pitch in inches is the jig offset (see **Pitch on the readout** below).
    - Each cut's position is the pitch center plus that cut's offset. For example, 3/8″ reverse and 1/8″ left puts the center at −.375 / −.125 (up and right positive). Two .023″ cuts per side at 20° then put the first cut at −.359 / −.169.
    - Signs follow the press's readout directions (below).
  - The cuts aren't stored.
- **Finger ovals only widen.** A finger hole's height is always its bit size, so fingers are never cut up-and-down. The shop records the bit that fits the hole across (`width64`); the hole size is the pilot.
  - **Across, away from the bridge:** the extra width is all cut on the side away from the bridge. The left finger hole moves left and the right finger hole moves right. Cutting starts at the pitch center and steps outward, in equal cuts of no more than 1/32″.
  - The center is the finger's pitch on the readout.
  - Example: a 21/32″ right finger hole opened to 23/32″ across gets two 1/32″ cuts to the right. With 3/4″ reverse (up for fingers), 1/2″ right, and up and right as plus, the readouts are +.750 / +.531, then +.750 / +.562.
- **Pitch on the readout.** Pitches are measured from the center of the grip, so the vertical direction depends on the hole:
  - Thumb: reverse is down and forward is up.
  - Fingers: reverse is up and forward is down.
  - Lateral is the same for every hole: left on the sheet is left on the press.
  - The readout number then also depends on the press setting below. For example, with up as plus, a thumb's 3/8″ reverse reads −.375 and a finger's 3/8″ reverse reads +.375. With down as plus, both flip.
- **Drill press readout direction.** The readout counts how the *ball* moves, which is opposite to the hole: to put a hole further right on the ball, the ball moves left. Presses also differ in which way they count, and some readouts can be configured. So each axis is a setting, saying which sign the readout shows when the *hole* moves up or right on the ball:
  - `drillSheets.verticalReadout: 'UP_POSITIVE' | 'DOWN_POSITIVE'`
  - `drillSheets.horizontalReadout: 'RIGHT_POSITIVE' | 'LEFT_POSITIVE'`
  - The defaults match the first shop's press. Horizontal is `LEFT_POSITIVE`: a hole moving right reads minus. For example, a 1/2″ right lateral centers at −.500, and a right finger's oval cuts read −.531, then −.563. Vertical is `UP_POSITIVE`, which hasn't been checked on a press yet.
  - They're a company setting that a location can override, and they move to the equipment record once presses are modelled.
  - It only changes how numbers are shown. The spec always stores pitch one way (forward positive, lateral right positive).
  - The drill press view and the editor's calculated cuts show every readout value, pitches included, in the press's convention.
- **Offset** (lateral thumb offset) is left out of v1.
- **Flexibility** is the hand's spread angle, normally 70–135°. A suggested starting pitch from flexibility and span may come later, only from a validated chart, and never under `proFit`.
- **CLT** (center line transformation) is the angle between the bowler's finger centerline and the ball's normal centerline. The degree reading is taken at the fingers; the alternative inch reading at the thumb isn't stored, because the chart below is keyed by degrees. It is only shown when the company setting `drillSheets.enableClt` is on. Auto-CLT then suggests the fingers' lateral pitch from the nearest chart line. Accepting fills in `holes.middle.pitch.lateral32` and `holes.ring.pitch.lateral32`, and a manual value always wins. Chart, right-handed (left-handed swaps Left and Right):

  | Line | CLT | Middle | Ring |
  |---|---|---|---|
  | A | 8° | 3/8″ L | 1/2″ R |
  | B | 16° | 5/16″ L | 9/16″ R |
  | C | 24° | 1/4″ L | 5/8″ R |
  | D | 32° | 3/16″ L | 11/16″ R |
  | E | 40° | 1/8″ L | 3/4″ R |

**Inserts and thumb hardware.** Finger `insert` and `vacu`, and thumb `hardware` (which replaced `slug`), are each a copy of a grip catalog choice:

```
insert   = { gripSizeId?, manufacturer, line, size64, label, od64, installStyle? }     // finger; gripSizeId null = "Other"
hardware = { gripSizeId?, manufacturer, line, kind, size64, label, od64, collar }     // thumb insert, slug or interchangeable
vacu     = { bit64, depth32 }                                                          // finger insert holes only
```

- **O.D.** With an insert or hardware set, the hole's `outsideDiameter64` is its `od64`. The API checks catalog choices against the catalog: the size must match, the O.D. must be one of that size's `od64_choices`, and the install style must be one the line offers.
- **Drilling interchangeable thumb hardware** (the drill press plan): pilot, then the collar bit down to the collar, then install the hardware. The thumb hole and its oval are drilled into the inner, not the ball.
  - The pilot is about 1/2″ smaller than the collar bit.
  - Pilot depth is 2-3/4″, which is safe for every system. JoPo Twist can go 3″; Turbo Switch Grip shouldn't go past 3″; VISE IT won't install if piloted too deep.
- **Thumb hardware and the hole.** A thumb insert sets both the hole size and the O.D. A slug, or an interchangeable system's inner, has the thumb hole drilled into it, and the hardware sets only the O.D. (the collar bit, for interchangeable systems). The editor warns when the hole, or its oval width, leaves less than 1/8″ of wall in a slug or VISE IT inner, and suggests the next size up.
- **Older sheets.** A sheet saved with the old insert shape (`{ manufacturer, insertSize64, type, model, color }`) is read as an "Other" insert, using the hole's size and O.D. An old `slug` is read as "Other" thumb hardware.
- **Vacu** applies to finger insert holes only. The top of the hole is drilled with a different bit from the O.D. below it.
  - `bit64` ranges from O.D. − 1/64″ (one bit smaller) to O.D. + 1/16″, in 1/64″ steps. It defaults to O.D. + 1/16″, the standard vacu.
  - `depth32` defaults to 1″ (32), the manufacturers' standard. A performance fit can set it anywhere from 1/2″ to 1-1/2″ in 1/16″ steps (16–48, even values).
  - **Drilling order:** the vacu bit first, to its depth, then the O.D. to the insert depth (2″ unless the hole sets `depth32`).
- **Color** isn't on the drill sheet; it's picked on the work order.

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

## Query client (Kysely over the Data API)

The API (`amplify/api`) uses **Kysely** with the `kysely-data-api` dialect. Prisma was ruled out because it needs direct database connections, which would mean Lambdas inside the VPC plus a NAT gateway or RDS Proxy.

- **Types:** generated from the migrations by `db/codegen.sh` into `amplify/api/db/schema.ts`. The SQL migrations stay the only source of truth.
- **Company scope:** tenant queries run inside `withCompany(db, companyId, …)`, one Data API transaction that first sets `app.company_id`.
- **Ids:** the Data API sends plain strings as text, so every id in a query goes through `uuid()` (a UUID type hint).
- **Returned values:** `numeric` comes back as a string, which keeps it exact. Timestamps come back as `Date`, and JSON is already parsed.

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

## Open items

1. **Customer sharing setting.** Do customers stay shared across all of a company's locations, or should there be a company-level toggle for chains that run locations independently?
