# Nomad Booking Challenge Plan

## Goal

Build a small Booking.com-like travel product for remote workers. The product direction is no longer “internet cafes”; it is a travel-stay marketplace with a digital-nomad angle so it stays clearly aligned with the recruiter brief.

## Product Framing

Nomad Booking helps users discover work-friendly stays with reliable Wi-Fi, desk setups, monitor access, quiet zones, and flexible check-in policies.

Core user journey:

1. Browse or search stays.
2. Open a stay detail page.
3. Inspect reviews, availability, and price.
4. Complete a mocked checkout flow.
5. Land on a confirmed booking screen.

## Scope Choices

Included:

- stay list/search
- stay detail page
- reviews list and add review flow
- mocked availability and pricing
- checkout flow with booking confirmation
- small backend API consumed by the frontend

Explicitly excluded to protect the timebox:

- auth
- favorites
- persistent “my bookings”
- real payment processing
- map integrations
- real inventory locking

## Why This Scope Fits The Challenge

- It matches the travel/stays requirement directly.
- It keeps the backend intentionally small.
- It proves product thinking without turning into a large platform build.
- It allows strong frontend quality signals: states, validation, responsiveness, and tests.

## Technical Direction

Frontend:

- React 19 + TypeScript + Vite
- React Router for navigation
- Tailwind CSS v4 + `shadcn/ui`
- TanStack React Query v5 for API-backed server state
- Zod for request, response, URL param, and form validation

Backend:

- Vercel Functions in `api/`
- `@vercel/node` request/response typing
- shared contracts imported from the frontend feature layer
- mocked in-memory store for seeded stays, reviews, and bookings

Testing and delivery:

- Vitest + Testing Library
- Bun for scripts and package management
- GitHub Actions CI for lint, typecheck, build, and test

## API Surface

- `GET /api/stays`
- `GET /api/stays/:id`
- `GET /api/stays/:id/reviews`
- `POST /api/stays/:id/reviews`
- `POST /api/bookings`

All inputs and outputs should be validated at the function boundary with Zod.

## Data Model Shape

Each stay should expose:

- id, name, slug
- city and country
- tagline and richer description
- nightly rate
- review summary
- remote-work perks
- availability slots with price
- review list

Bookings should return only the confirmation shape needed by the challenge.

## UX Notes

- Responsive from mobile up.
- Clear loading, empty, and error states on async screens.
- Accessible labels for search, review, and checkout forms.
- A more curated visual direction than a default travel-card grid, while still feeling credible for a recruiter demo.

## Repo Foundation Requirements

The repo should not stay in template mode. It needs:

- Router and QueryClient wiring in the app entry
- backend function scaffolding under `api/`
- Bun-native scripts for frontend, API, full local dev, testing, and checks
- TypeScript coverage for frontend and API code
- a real README for setup, architecture, tradeoffs, and next steps
- CI workflow

## Tradeoffs To Document

- Mocked backend data is acceptable for the challenge, but persistence is intentionally deferred.
- Because of that tradeoff, “my bookings” should not be presented as a core feature.
- Review submission and booking confirmation should work in the demo flow, while the README explains the durability limitation.

## Suggested Implementation Order

1. Settle the product framing as nomad-friendly travel stays.
2. Build shared schemas and mock data contracts.
3. Implement the Vercel Functions API.
4. Wire React Query query keys, fetchers, and mutations.
5. Build the browse, detail, review, and checkout screens.
6. Add tests for validation and at least one async UI flow.
7. Finish README, CI, and release notes.

## Submission Checklist

- full source in one repo
- local setup documented
- architecture notes documented
- tradeoffs documented
- “what I’d do next” documented
- short LLM usage note documented
- CI present
- build passes

## Timebox Guidance

This should still respect the recruiter’s 4-6 hour spirit. If time runs out, stop with a coherent vertical slice and document the remaining work instead of bolting on half-finished features.
