# Drilld

Multi-tenant SaaS for bowling pro shops, centered on ball drilling. Each pro shop manages its own customers, drill specs, work orders, and inventory.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc`) and build
- `npm run lint` — ESLint, zero warnings allowed
- `npm run preview` — preview the production build

## Layout

- `src/` — React app: `components/`, `hooks/`, `types/`, `services/`, `data/` (mock data), `utils/`
- `amplify/` — Amplify Gen 2 backend: `auth/`, `data/`, `functions/`, `storage/`

## Stack

- AWS Amplify Gen 2, Vite, React, TypeScript, Tailwind
- PostgreSQL on RDS via Prisma ORM
- Cognito (auth), GraphQL (API), Lambda (complex operations), S3 (storage), VPC setup

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

- Drill sheet UX was refactored to use visual layouts, correct terminology, and full insert support.
- The backend is ready to deploy, with migrations and seed data. The Amplify Gen 2 + RDS/Prisma config and dependency issues are resolved.
- Next:
  1. Complete work order management.
  2. Finalize location management.
  3. Build tiered pro shop settings.
