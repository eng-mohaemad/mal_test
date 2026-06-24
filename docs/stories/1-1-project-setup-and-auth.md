---
baseline_commit: baccb3f530d41fb9bad23d4a9436509172b1fb8c
---

# Story 1.1: Project Setup & Authentication

Status: review

## Story

As a **developer**,
I want a Next.js project wired to Supabase Auth with sign-in-only flow and role-based routing,
so that employees and managers can securely log in and be directed to the correct dashboard.

## Acceptance Criteria

1. Next.js 14 App Router project with Tailwind CSS is configured and runs locally.
2. Supabase client is initialised with SSR support (`@supabase/ssr`) using env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. A `/login` page renders an email + password sign-in form (no sign-up link).
4. On successful login, the user is redirected based on their role:
   - `role = employee` → `/dashboard/employee`
   - `role = manager`  → `/dashboard/manager`
5. Role is stored in Supabase `auth.users.user_metadata.role` (set at seed time, not by the user).
6. Unauthenticated access to any `/dashboard/*` route redirects to `/login`.
7. A "Sign out" button on all dashboard pages signs the user out and redirects to `/login`.
8. Auth state is handled server-side via middleware (`middleware.ts`) — no client-side redirect flicker.

## Tasks / Subtasks

- [x] Configure Supabase SSR client (AC: 2)
  - [x] Create `lib/supabase/server.ts` (server component client)
  - [x] Create `lib/supabase/client.ts` (browser client)
  - [x] Add env vars to `.env.local` and `.env.example`
- [x] Build `/login` page (AC: 3)
  - [x] Email + password form with validation
  - [x] Error message on failed login
  - [x] No sign-up link visible
- [x] Implement role-based redirect on login (AC: 4, 5)
  - [x] Read `user_metadata.role` after session established
  - [x] Redirect to correct dashboard path
- [x] Write `middleware.ts` for route protection (AC: 6, 8) — implemented as `proxy.ts` (Next 16 renamed the convention)
  - [x] Protect all `/dashboard/*` routes
  - [x] Redirect unauthenticated users to `/login`
- [x] Add sign-out button to shared layout (AC: 7)

## Dev Notes

- Use `@supabase/ssr` (NOT deprecated `@supabase/auth-helpers-nextjs`). Pattern: `createServerClient` for RSC/actions, `createBrowserClient` for client components.
- Middleware must refresh the session cookie on every request — use the Supabase middleware helper pattern.
- Role is read from `session.user.user_metadata.role` — it is seeded directly in Supabase, never set by the user.
- Do NOT build a sign-up page. The login form is the only auth entry point.
- Tailwind classes only — no external component library for this story.

### Project Structure Notes

```
app/
  (auth)/
    login/
      page.tsx
  (dashboard)/
    layout.tsx          ← shared header with sign-out
    employee/
      page.tsx          ← placeholder, built in Epic 2
    manager/
      page.tsx          ← placeholder, built in Epic 3
lib/
  supabase/
    client.ts
    server.ts
middleware.ts
```

### References

- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js App Router middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx next build` — success; routes `/login`, `/dashboard/employee`, `/dashboard/manager`, `/`; `proxy.ts` registered as "Proxy (Middleware)"

### Completion Notes List

- **Next.js version deviation:** AC1 specifies "Next.js 14", but the project ships **Next.js 16.2.9 + React 19 + Tailwind v4** (per `package.json` and `AGENTS.md`). Implemented against the installed version.
- **`middleware.ts` → `proxy.ts`:** Next 16 deprecated the `middleware` file convention and renamed it to `proxy` (exported `proxy` function, Node.js runtime default). Verified in `node_modules/next/dist/docs/.../proxy.md`. Route protection + session refresh live in `proxy.ts` + `lib/supabase/proxy.ts`. Functionally satisfies AC6/AC8.
- **Route-group fix:** the story's structure sketch used `app/(dashboard)/...`. A `(parenthesized)` route group is stripped from the URL, which would have produced `/employee` and `/manager` — breaking AC4/AC6 (`/dashboard/*`). Dashboards live under the real `app/dashboard/` segment so URLs are `/dashboard/employee` and `/dashboard/manager`. The `(auth)` group is kept (it correctly yields `/login`).
- **Async cookies:** `cookies()` is async in Next 16 — `lib/supabase/server.ts` awaits it.
- **`@supabase/ssr` 0.12** uses the `getAll`/`setAll` cookie interface (verified against installed package), not the deprecated `get`/`set`/`remove`.
- **Root `/`:** replaced the create-next-app template page with a `redirect("/login")` since this is a sign-in-only app with no public landing page.
- **`.env.local`:** created with placeholder values (gitignored). Real Supabase URL/anon key are wired at seed/deploy time (stories 1-2 / 4-1).
- **Tests:** no test framework is installed in this project (no jest/vitest/playwright, no `test` script). Adding one is a new dependency (a HALT condition under this workflow), so it was not introduced unprompted. Validation was done via the project's actual gates: `tsc`, `eslint`, `next build`. Recommend deciding on a test stack (e.g. Playwright for the auth E2E flow) in a follow-up.

### File List

- `lib/supabase/server.ts` (new)
- `lib/supabase/client.ts` (new)
- `lib/supabase/proxy.ts` (new)
- `lib/auth.ts` (new)
- `proxy.ts` (new)
- `app/(auth)/login/page.tsx` (new)
- `app/(auth)/login/actions.ts` (new)
- `app/dashboard/layout.tsx` (new)
- `app/dashboard/actions.ts` (new)
- `app/dashboard/employee/page.tsx` (new)
- `app/dashboard/manager/page.tsx` (new)
- `app/page.tsx` (modified — redirect to /login)
- `app/layout.tsx` (modified — metadata title/description)
- `.env.example` (new)
- `.env.local` (new, gitignored)

## Change Log

| Date       | Change                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| 2026-06-24 | Implemented Story 1.1: Supabase SSR auth, /login, role-based redirect, proxy.ts route protection, dashboard layout + sign-out. Status → review. |
