# Nomad Booking

Nomad Booking is supposed to be a Booking.com-like travel product tailored to digital nomads looking for nice places to stay (with good wifi, desk, etc. with good working conditions)

# Assumptions

- Auth wasn't specified as a requirement, so persistence for some features that would involve user data (favourites, bookings, reviews) is done via localStorage

## Stack

- React 19 + TypeScript + Vite
- Bun for package management and scripts
- Shadcn UI + Tailwind v4
- TanStack React Query for server state
- Zod for boundary/schemas validation
- Vercel Serverless Functions as the backend
- Vitest + Testing Library for testing

## Getting Started

I used bun, however, the project can be run with whatever package manager you prefer.

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

Or only the backend:

```bash
bun run dev:api
```

## Data architecture

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

## LLM Usage Note

- I mostly used GPT 5.4 via Codex.
- It helped me with accelerating the overall implementation speed, by taking care of all the grunt work like writing tests, api requests, generating mock data and scaffodling the overall project structure.
- A lot of the UI was generated with AI as well, however most features took manual intervention to get right ( but there's still some generic AI-generated UI left )

## What I would do next

- Implementing a proper persistence layer/database
- Definitely adding auth
- Intl translations
- More polished UI ( some screens still look like generic slop )
- Maybe add precise coordinates for each stay, in order to implement a map-based search
