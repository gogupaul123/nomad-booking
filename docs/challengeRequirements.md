Build a small, Booking.com-like product focused on the frontend. Creativity encouraged.

Quick facts
· Domain: Travel (hotels or similar stay products).

· Complexity: Mid+ (end-to-end flow, not just UI screens).

· Stack: React (TypeScript recommended).

· Includes a small backend (server) that your frontend talks to.

· LLM usage for coding is encouraged.

· Suggested timebox: 4-6 hours. Stop when you hit the timebox and document what you would do next.

What you are building
A travel booking web app where a user can discover stays, view details and reviews, and complete a checkout flow. We care more about product thinking and engineering quality than pixel-perfect design.

Must-have capabilities (keep it simple)
· Search or browse a list of stays (filters and sorting are up to you).

· Stay details page.

· Reviews/comments: list + add a review/comment (moderation can be basic).

· Availability + price display.

· Checkout flow that results in a confirmed booking (payment can be mocked).

· Frontend calls a backend API you provide (even if the data is mocked).

Where you can be creative
· Choose the exact product scope: hotels, apartments, hostels, experiences, etc.

· Pick your UX: map view, saved favorites, personalized feed, compare stays, etc.

· Decide what 'availability' means (date range, rooms, guests) and how deep you go.

Backend expectations
Keep the backend small. It exists to support your frontend and prove you can design and consume APIs. You can use Node (Express/Fastify/Nest), serverless functions, or a minimal mock server.

· Minimum API surface (example, you can change it):

· GET /stays?query=&filters=... (list/search)

· GET /stays/:id (details)

· GET /stays/:id/reviews (reviews)

· POST /stays/:id/reviews (add review)

· POST /bookings (create booking / checkout)

Non-functional requirements
· Runs locally with a single command (or a clearly documented two-step setup).

· Responsive layout (desktop + mobile).

· Loading + empty + error states for async screens.

· Basic accessibility (labels, keyboard nav where it matters, sensible focus).

· Testing: at least a few meaningful tests (unit and/or integration/e2e).

· Observability basics: helpful logging, and optionally a simple metrics/error tool.

Release process
· CI pipeline (example: GitHub Actions) that runs lint + tests on PR/push.

· Build step that produces a production bundle.

· A simple release approach (example: tags, changelog, version bump).

· Optional but great: deployment to Vercel/Netlify/Render and share the URL.

What to submit
· Git repository link with full source code (frontend + backend).

· README that includes: setup, scripts, architecture notes, tradeoffs, and what you would do next.

· Short note on LLM usage: what you used it for, prompts/approach, and any guardrails.

· Recording presenting the solution

Notes
We do not expect a huge project. We expect smart scope choices. If you cut features, say why. If you make assumptions, write them down.
