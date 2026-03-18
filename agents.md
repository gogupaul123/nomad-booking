# AGENTS

This file defines the default engineering expectations for work in this repository.

## Non-Negotiables

- Always use the best matching installed skill(s) for the task before doing substantial work.
- If a task clearly matches an installed skill, use it and say which skill(s) you are applying in your progress update.
- For this repo, the most commonly relevant skills are `frontend-design`, `tanstack-query`, `vercel-react-best-practices`, `security-best-practices` when explicitly requested, and `openai-docs` for OpenAI product work.
- Prefer existing `shadcn/ui` components and patterns over custom one-off UI primitives.
- Maintain current repo conventions instead of introducing a second design system, a second data-fetching pattern, or ad hoc validation.

## Stack Expectations

- Framework: React 19 + TypeScript + Vite.
- Package manager and task runner: Bun.
- Styling: Tailwind CSS v4 with the existing `shadcn/ui` setup.
- UI primitives: `shadcn` components under `src/components/ui`.
- Validation: `zod` for runtime validation and schema-driven parsing.
- Async server state: `@tanstack/react-query` v5.
- Backend: Vercel Functions using `@vercel/node`.
- Testing: Vitest + Testing Library + `@testing-library/jest-dom`.

## UI Rules

- Reuse and compose from `src/components/ui` first.
- When a needed primitive does not exist yet, add it via `shadcn` instead of hand-rolling a parallel component set.
- Follow the existing `components.json` configuration: `base-nova`, CSS variables enabled, `mist` base color, and `hugeicons`.
- Use the shared `cn` helper from `src/lib/utils.ts`.
- Build accessible components with correct semantics, focus states, keyboard support, and label relationships.

## Zod Rules

- Validate data at boundaries, not halfway through rendering.
- Use Zod for form input parsing, URL/search param parsing, local storage/session storage parsing, API request/response validation, and any untrusted external data.
- Prefer schema-driven transformations over loose casting or `as` assertions.
- Do not introduce silent fallback behavior for invalid data unless product requirements explicitly call for it.

## React Query Rules

- Use TanStack React Query v5 for server state instead of fetching data directly inside `useEffect`.
- Use typed, stable query keys.
- Co-locate query options, fetchers, and related types near the feature that owns them.
- Use mutations for writes and invalidate or update related queries intentionally.
- Prefer `select` and schema parsing for shaping remote data instead of spreading transformation logic across components.
- Handle loading, error, empty, and success states explicitly in the UI.
- Follow v5 APIs and patterns, not older v4-style examples.

## Backend Rules

- Treat this repo as a Vercel-hosted frontend with serverless backend functions, not a long-running custom server.
- Put backend handlers under `api/` following Vercel Function conventions.
- Use `@vercel/node` types and patterns for function handlers when needed.
- Validate request inputs and response shapes with Zod at the function boundary.
- Keep shared schemas and shared types in reusable modules instead of duplicating contracts between frontend and backend.
- Prefer frontend data access through React Query hooks that call the Vercel Functions layer cleanly.
- Do not introduce Express, Fastify, or a custom Node server unless there is an explicit architectural decision to do so.

## Testing Rules

- Add or update tests for meaningful UI behavior, state transitions, validation logic, and async data flows.
- Prefer Testing Library queries that reflect user behavior and accessibility.
- Avoid brittle tests tied to implementation details, private state, or class names.
- Use `jest-dom` matchers where they improve readability.
- If you change behavior and do not add tests, explain why.

## Quality Gates

- Before finishing work, run the checks relevant to your changes.
- Standard checks for this repo are `bun run lint`, `bun run typecheck`, `bun run build`, and `bunx vitest run` when tests were added or changed.
- Do not leave the repo in a state with avoidable type, lint, or test failures.

## Tooling Rules

- Prefer Bun commands in this repository: `bun install`, `bun run <script>`, and `bunx <tool>`.
- Do not default to `npm`, `npx`, `pnpm`, or `yarn` unless the user explicitly asks for one of them.

## TypeScript And React Best Practices

- Prefer precise types and inference over `any`.
- Keep components focused and split complex logic into utilities, hooks, or feature modules when needed.
- Avoid unnecessary effects and derived state.
- Keep data flow explicit and predictable.
- Prefer absolute imports via `@/...` where the repo already supports them.
- Preserve existing patterns unless there is a clear reason to improve them.

## Change Discipline

- Make the smallest change that cleanly solves the problem.
- Match the established code style before introducing new abstractions.
- If a task touches UI, validation, async data, or tests, apply the relevant stack expectations above by default.
