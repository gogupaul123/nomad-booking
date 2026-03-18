# Nomad Booking

Nomad Booking is a small Booking.com-like travel product tailored to remote workers. The repo folder remains `nomad-cafe` locally, but the product, package, docs, and app naming are all `nomad-booking`.

## Stack

- React 19 + TypeScript + Vite
- Bun for package management and scripts
- Tailwind CSS v4 + `shadcn/ui`
- TanStack React Query v5 for server state
- Zod for boundary validation
- Vercel Functions with `@vercel/node`
- Vitest + Testing Library

## Getting Started

Install dependencies:

```bash
bun install
```

Run the app locally:

```bash
bun run dev
```

This starts:

- Vite on `http://localhost:5173`
- a local Bun API shim on `http://localhost:3001`
- a Vite proxy from `/api/*` to that local API process

If you only need the frontend shell, use:

```bash
bun run dev:web
```

## Scripts

- `bun run dev` starts both the Vite app and the local API
- `bun run dev:web` starts only the Vite app
- `bun run dev:api` starts the local API shim
- `bun run dev:full` is an alias for `bun run dev`
- `bun run lint` runs ESLint
- `bun run typecheck` runs project references across app, config, and API code
- `bun run build` creates the production bundle
- `bun run test` runs Vitest

## Architecture Notes

- `src/features/stays/schemas.ts` holds shared Zod schemas for stays plus booking-confirmation types for checkout.
- `src/features/stays/mock-store.ts` is the mock stay domain store used by the Vercel Functions.
- `api/` contains the backend surface required by the challenge:
  - `GET /api/stays`
  - `GET /api/stays/:id`
  - `GET /api/stays/:id/reviews`
  - `POST /api/stays/:id/reviews`
  - `POST /api/bookings`
- `scripts/dev-api.ts` mirrors the same API contract locally so the repo runs with Bun only and without Vercel login friction.
- `src/features/stays/query-options.ts` co-locates TanStack Query keys and stay query options.
- The checkout flow ends in a confirmation screen rather than a persistent account area to stay inside the recruiter challenge scope.

## Tradeoffs

- Data is mocked and stored in memory, so stays, confirmed bookings, and newly added reviews are not durable across reloads or cold starts.
- The app prioritizes recruiter-facing clarity over breadth: browse, stay details, reviews, availability, and checkout are covered without adding auth or a saved bookings dashboard.
- React Router is used for client-side routing; direct deployment routing rules can be added once the GitHub repo rename and Vercel project settings are finalized.

## Testing

The repo currently includes:

- schema validation coverage for search params and reviews
- an integration-style home page test that exercises async list rendering

## CI And Release Approach

- `.github/workflows/ci.yml` runs lint, typecheck, build, and tests on push and pull request.
- A lightweight release approach for the challenge is:
  1. update `package.json` version
  2. add a short changelog/release note in the PR or README
  3. create a git tag for the submitted version

## What I Would Do Next

- add a direct-deploy `vercel.json`/project config once the repo rename is finalized
- improve booking confirmation resilience with a tiny persistence layer
- expand tests around checkout and review submission
- add observability wiring beyond console event logs

## LLM Usage Note

LLMs were used to accelerate implementation, refactoring, and documentation. Guardrails for this repo are captured in `AGENTS.md`: use the correct installed skills, keep data fetching in TanStack Query, validate boundaries with Zod, prefer `shadcn/ui`, and run Bun-based quality gates before finishing.
