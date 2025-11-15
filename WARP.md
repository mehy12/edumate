# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core commands

Use `npm` by default; other package managers from the Next.js template (yarn/pnpm/bun) are not configured in this repo.

### Install dependencies

- `npm install`

### Run the app in development

- `npm run dev`
  - Starts the Next.js dev server on `http://localhost:3000`.

### Build and run in production mode

- `npm run build`
  - Builds the Next.js app.
- `npm run start`
  - Starts the production server after a successful build.

### Linting

- `npm run lint`
  - Runs `next lint` (ESLint with the Next.js preset) over the codebase.

### Database (Drizzle + Neon)

Drizzle is configured via `drizzle.config.ts` and uses PostgreSQL (Neon) via `DATABASE_URL`.

- `npm run db:push`
  - Runs `drizzle-kit push` using `drizzle.config.ts` to sync schema in `src/db/schema.ts` to the database defined by `DATABASE_URL`.
- `npm run db:studio`
  - Opens Drizzle Studio for inspecting/modifying the database.

### Webhook tunneling for local development

- `npm run dev:webhook`
  - Runs `ngrok http --url=casual-prepared-macaque.ngrok-free.app 3000`.
  - Requires `ngrok` to be installed and authenticated.
  - Exposes the local Next.js server on port `3000` to the fixed ngrok URL so that external services (e.g. Stream webhook callbacks) can reach `/api/webhook` and `/api/inngest` during local development.

### Tests

- There is currently **no** `test` script or test framework configured in `package.json`.
- If you add tests (e.g. Jest/Vitest/Playwright), also add `npm test` and `npm test -- <pattern>` conventions here for future updates to this file.

## High-level architecture

This is a Next.js App Router project living under `src/`, with a modular domain structure (`modules/`) and a typed backend stack: TRPC for API routing, Drizzle ORM for data access, Inngest for background jobs, and Stream for video and transcription.

### Path aliases and TypeScript

- `tsconfig.json` defines `@/*` mapped to `./src/*`.
  - All imports of the form `@/something` resolve under `src/`.
- TypeScript is strictly typed (`"strict": true`) and Next.js plugin is enabled in `compilerOptions.plugins`.

### App Router and route groups (`src/app`)

The main Next.js entry is `src/app/layout.tsx`, which:

- Wraps the app with:
  - `TRPCReactProvider` (`@/trpc/client`) for TRPC hooks on the client.
  - `NuqsAdapter` for URL search params handling.
  - `Toaster` (`@/components/ui/sonner`) for toast notifications.
- Sets global styles via `./globals.css` and applies an `Inter` font.

Key route groups:

- `src/app/(auth)/`
  - `layout.tsx` renders a centered auth layout.
  - Contains routes like `sign-in/page.tsx` and `sign-up/page.tsx` that typically delegate to views in `src/modules/auth/ui/views/`.

- `src/app/(dashboard)/`
  - `layout.tsx` wraps dashboard pages in a sidebar/toolbar shell using `DashboardSidebar` and `DashboardNavbar` from `src/modules/dashboard/ui/components/` and `SidebarProvider` from `@/components/ui/sidebar`.
  - `page.tsx` is the authenticated home/dashboard page. It:
    - Uses `auth.api.getSession` with `next/headers` to enforce authentication.
    - Redirects unauthenticated users to `/sign-in`.
    - Renders `HomeView` from `src/modules/home/ui/views/home-view.tsx`.
  - `meetings/page.tsx` and `agents/page.tsx` implement the main resource listing pages.
    - Both pages enforce authentication at the server component level.
    - Use TRPC + React Query SSR-style prefetching and hydration for list views.

- `src/app/call/`
  - `layout.tsx` renders a full-screen black background container for the call UI.
  - `call/[meetingId]/page.tsx` (see `src/modules/call/ui/...`) is the live call experience bound to a `meetingId`.

- `src/app/api/`
  - `auth/[...all]/route.ts` exposes Better Auth API routes.
  - `trpc/[trpc]/route.ts` exposes the TRPC HTTP endpoint.
  - `inngest/route.ts` exposes the Inngest function handler.
  - `webhook/route.ts` handles Stream webhooks (call lifecycle, transcription, recording, and Inngest triggering).

### Domain modules (`src/modules`)

The `modules` folder houses domain-specific logic, keeping views, components, hooks, schemas, and server logic co-located.

Common structure across modules:

- `hooks/` – client-side hooks for filters or UI state derived from URL/search params.
- `params.ts` – parsing and normalizing search params via Nuqs.
- `schema(s).ts` – Zod schemas and validation for input/query parameters.
- `server/` – TRPC procedures or server-only logic for that domain.
- `types.ts` – shared TypeScript types.
- `ui/components/` – reusable UI components for that domain.
- `ui/views/` – high-level pages/containers used by `src/app` routes.

Key modules:

- `src/modules/agents`
  - TRPC router lives in `server/procedure.ts`, re-exported via `src/trpc/routers/_app.ts` under the `agents` namespace.
  - `hooks/use-agents-filters.ts` and `params.ts` model filter/search state, used by `AgentsView` and surrounding UI.
  - UI components and views implement the agents list, headers, search, filters, and agent creation/update dialogs.

- `src/modules/meetings`
  - Similar structure to `agents` with `server/procedure.ts` registered under `meetings` in TRPC.
  - `schema.ts` defines meeting-specific Zod schemas.
  - `hooks/use-meetings-filters.ts` and `params.ts` handle filters (status, agent, etc.).
  - UI components implement per-status states (`active`, `upcoming`, `processing`, `completed`, `cancelled`), list headers, search and filter UIs, and dialogs for creating/updating meetings.
  - Views (`ui/views/`) render the main meetings table and individual meeting page, and are fed by TRPC queries in combination with React Query prefetching.

- `src/modules/call`
  - Encapsulates the live call UX.
  - `ui/components` contains call lifecycle components (lobby, active call, end screen, provider/wrapper, main UI container).
  - `ui/views/call-view.tsx` is the main call view that ties these pieces together.

- `src/modules/dashboard` and `src/modules/home`
  - Dashboard wraps global navigation; home renders the initial authenticated landing content.

- `src/modules/auth`
  - Provides auth views used from `(auth)` routes for sign-in/up.

### Data layer (Drizzle ORM) and database schema

- Drizzle configuration:
  - `drizzle.config.ts` points to `src/db/schema.ts` and uses `DATABASE_URL` for a PostgreSQL database.
- Database access:
  - `src/db/index.ts` sets up a Drizzle client using `drizzle-orm/neon-http` with `DATABASE_URL`.
- Schema:
  - Defined in `src/db/schema.ts` using `pgTable` and `pgEnum`.
  - Core tables:
    - `user`, `session`, `account`, `verification`: user identity and auth backing tables.
    - `agents`: AI agents owned by users, with `instructions` used to configure call behavior.
    - `meetings`: Meetings linked to users and agents; includes status enum (`upcoming`, `active`, `processing`, `completed`, `cancelled`), transcript URL, recording URL, summary, and timestamps.

### Authentication (Better Auth)

- `src/lib/auth.ts` configures Better Auth with:
  - `socialProviders` (GitHub and Google) using environment variables `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
  - Drizzle adapter (`drizzleAdapter`) wired to the same `db` and `schema` as Drizzle ORM.
  - Email/password auth enabled.
- `auth.api.getSession({ headers })` is used in server components (e.g. dashboard and listing pages) to gate access and redirect unauthenticated users.
- App routes under `src/app/api/auth/[...all]/route.ts` are the HTTP interface for auth flows.

### TRPC API layer

- TRPC initialization:
  - `src/trpc/init.ts` defines `createTRPCRouter` and `createTRPCContext` (not shown here but used broadly).
  - `src/trpc/routers/_app.ts` composes domain routers:
    - `agentsRouter` from `@/modules/agents/server/procedure`.
    - `meetingsRouter` from `@/modules/meetings/server/procedure`.
  - The composite `appRouter` is exposed as an HTTP endpoint via `src/app/api/trpc/[trpc]/route.ts` using `fetchRequestHandler`.

- Server-side queries:
  - `src/trpc/server.tsx` and `src/trpc/query-client.ts` (not shown above) coordinate TRPC with React Query and Next.js server components.
  - `getQueryClient` + `trpc.*.getMany.queryOptions` are used in dashboard list pages to prefetch data server-side and hydrate on the client using `HydrationBoundary`.

- Client-side consumption:
  - `TRPCReactProvider` in `src/app/layout.tsx` wraps the app so client components can use `trpc` hooks.

### Inngest background jobs

- `src/inngest/client.ts` (not shown here) configures the Inngest client.
- `src/inngest/functions.ts` defines the `meetingsProcessing` Inngest function:
  - Triggered by an event named `"meetings/processing"`.
  - Fetches a meeting transcript (JSONL) from `event.data.transcriptUrl`.
  - Parses transcript entries into `StreamTranscriptItem` objects.
  - Enriches each transcript item with speaker names by querying `user` and `agents` tables.
  - Uses an `@inngest/agent-kit` `summarizer` agent backed by a Gemini model to generate a 1–2 sentence summary.
  - Updates the corresponding `meetings` row with `status: "completed"` and the generated `summary`.
- `src/app/api/inngest/route.ts` exposes this function via `serve({ client: inngest, functions: [meetingsProcessing] })`.
- Note: there is a hard-coded Gemini API key in `src/inngest/functions.ts`. Future changes should move this into environment variables instead of inlining it in code.

### Stream video integration and webhooks

- Stream client:
  - `src/lib/stream-video.ts` exports `streamVideo`, a `StreamClient` configured using:
    - `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`
    - `STREAM_VIDEO_SECRET_KEY`

- Webhook handler:
  - `src/app/api/webhook/route.ts` handles Stream webhook events using `NextRequest`/`NextResponse`.
  - Verifies requests via `streamVideo.verifyWebhook(body, signature)` and checks the `x-signature` and `x-api-key` headers against `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`.
  - Handles several event types:
    - `call.session_started`:
      - Validates `meetingId` from `event.call.custom.meetingId`.
      - Ensures the meeting exists and is not already in a terminal state.
      - Marks the meeting `active` and sets `startedAt`.
      - Retrieves the associated agent, connects it to the call with `video.connectOpenAi`, and updates the agent session with `instructions` from the `agents` table.
    - `call.session_participant_left`:
      - Ends the call via `streamVideo.video.call("default", meetingId).end()`.
    - `call.session_ended`:
      - Marks the meeting as `processing` and sets `endedAt`.
    - `call.transcription_ready`:
      - Saves the transcript URL on the meeting.
      - Sends an Inngest event `"meetings/processing"` with `meetingId` and `transcriptUrl` to kick off summarization.
    - `call.recording_ready`:
      - Saves the recording URL on the meeting.

### Shared UI and utilities

- `src/components/ui/` contains a design system built atop Radix UI primitives and other headless components:
  - Buttons, forms, dialogs, tooltips, sidebar, tables, pagination, etc.
  - These components are used across domain modules to enforce consistent styling and interaction.

- `src/components/` includes non-domain-specific pieces like tables, avatars, loading/empty states, and responsive container wrappers.

- `src/hooks/` collects generic hooks such as `use-confirm` and `use-mobile` that can be reused in multiple modules.

- `src/lib/utils.ts` and other helpers (e.g. `src/lib/avatar.tsx`) provide small utilities and UI helpers shared across modules.

## Environment configuration overview

Future changes will often depend on environment variables; relevant ones visible in the codebase include:

- Database and ORM:
  - `DATABASE_URL` – Postgres connection string used by Drizzle and Neon.

- Auth providers (Better Auth):
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

- Stream video and webhooks:
  - `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`
  - `STREAM_VIDEO_SECRET_KEY`

- OpenAI / agent integrations:
  - `OPENAI_API_KEY` (used when connecting agents to calls via Stream).

When adding new features that depend on external services, prefer wiring them through environment variables in `process.env` and documenting the variable names in this section rather than hard-coding secrets in the code.