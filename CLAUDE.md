# Drilld

Multi-tenant SaaS for bowling pro shops, centered on ball drilling. Each pro shop manages its own customers, drill specs, work orders, and inventory.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc`) and build
- `npm run lint` — ESLint, zero warnings allowed
- `npm run preview` — preview the production build

## Layout

- `src/App.tsx` — tab-based navigation (no router); sections wrapped in `ProtectedRoute` with permission strings like `read:customers`
- `src/components/<feature>/` — one folder per feature: customers, drillsheets, balls, workorders, locations, employees, settings, auth, layout; shared primitives in `components/ui/`
- `src/hooks/use<Feature>.ts` — one data hook per feature; currently all read from mock data
- `src/data/` — mock data (`mockData.ts`, `mockLocationData.ts`, `mockProShopSettings.ts`)
- `src/types/` — domain types split by file, re-exported from `types/index.ts`
- `src/utils/InsertValidation.ts` — finger insert validation
- `src/services/` — empty; intended home for the real API layer
- `amplify/` — Amplify Gen 2 backend scaffold: `auth/`, `data/`, `functions/`, `storage/` (all empty so far)

## Stack

- Frontend: Vite, React, TypeScript, Tailwind
- Target backend (not built yet): AWS Amplify Gen 2 — Cognito (auth), GraphQL (API), Lambda, S3, PostgreSQL on RDS via Prisma, in a VPC
- Hosting: Amplify (`amplify.yml` runs `npm ci` then `npm run build`, serves `dist/`); env vars documented in `.env.example`

## Domain rules (get these right)

- Span (fit, full, cut-to-cut) and bridge are separate measurements. Never conflate them.
- Be explicit about edge-to-edge vs center-to-center calculations.
- Drill sheets cover spans, bridge distances, pitch angles, hole specs, and finger insert compatibility.
- Finger inserts: VISE, Turbo, JoPo. Use each manufacturer's real size ranges and specs.
- Use industry-standard drill bit sizes and measurement conventions.
- Roles: Manager, Senior Tech, Technician, Apprentice.
- Drill sheets live under customer profiles. They are not standalone navigation items.

## Conventions

- One component per file. No monolithic files.
- Custom hooks for data management. Keep type definitions thorough and split into separate files.
- Keep mock data separate from component logic.
- Follow existing project patterns.
- When an architectural improvement and backward compatibility conflict, choose maintainability.
- Keep separation of concerns clean, with clear import/export relationships.

## UX

- Use progressive disclosure.
- Put admin functions, like settings, behind header icons, not in primary nav.
- Use visual layouts over text for spatial things. Drill sheets render as ball hole layouts, with finger holes side by side.

## Code review focus

Look for incorrect imports, circular dependencies, and unnecessary complexity.

## Status and next up

- The frontend runs entirely on mock data. Hooks simulate API calls with `setTimeout`.
- No backend code exists in this repo yet: `amplify/` subfolders, `src/services/`, and `amplify_outputs.json` are empty, and there is no Prisma schema.
- `npm run build` currently fails type-checking (about 33 TS errors, mostly in `settings/tabs/BillingSettingsTab.tsx`, `customers/CustomerOverview.tsx`, `settings/tabs/IntegrationSettingsTab.tsx`). Fix these before deploying.
- Drill sheet UX was refactored to use visual layouts, correct terminology, and full insert support.
- Next:
  1. Get `npm run build` passing.
  2. Complete work order management.
  3. Finalize location management.
  4. Build tiered pro shop settings.
  5. Stand up the Amplify Gen 2 backend and replace mock data in hooks with real services.
