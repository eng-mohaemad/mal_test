---
baseline_commit: 8ce3712ca08161d04671e1e599565af6d7ce3d63
---

# Story 1.2: Supabase Schema, RLS Policies & Seed Data

Status: review

## Story

As a **developer**,
I want the Supabase database schema, Row Level Security policies, and seed data set up,
so that the app has a secure data layer with pre-existing test accounts ready for the assessors.

## Acceptance Criteria

1. A `leave_requests` table exists with columns:
   - `id` uuid PRIMARY KEY default gen_random_uuid()
   - `employee_id` uuid NOT NULL references auth.users(id)
   - `employee_name` text NOT NULL
   - `type` text NOT NULL CHECK (type IN ('vacation','sick','personal'))
   - `start_date` date NOT NULL
   - `end_date` date NOT NULL
   - `reason` text
   - `status` text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
   - `manager_comment` text
   - `reviewed_at` timestamptz
   - `reviewed_by` uuid references auth.users(id)
   - `created_at` timestamptz NOT NULL DEFAULT now()
2. RLS is enabled on `leave_requests`.
3. RLS policy: employees can only SELECT/INSERT their own rows (`employee_id = auth.uid()`).
4. RLS policy: managers can SELECT all rows.
5. RLS policy: managers can UPDATE `status`, `manager_comment`, `reviewed_at`, `reviewed_by` on any row.
6. Employees cannot UPDATE or DELETE any row.
7. Two test users are seeded in Supabase Auth with known credentials:
   - `employee@test.com` / `Test1234!` — role: `employee`, name: `Alex Johnson`
   - `manager@test.com`  / `Test1234!` — role: `manager`,  name: `Sam Rivera`
8. A `profiles` table (or view) maps `user_id → name, role` for display purposes.
9. SQL migration file is committed to `supabase/migrations/` so it can be re-applied.

## Tasks / Subtasks

- [x] Write migration SQL for `leave_requests` table (AC: 1)
- [x] Enable RLS and write policies (AC: 2–6)
  - [x] Employee SELECT own rows
  - [x] Employee INSERT own rows
  - [x] Manager SELECT all rows
  - [x] Manager UPDATE status fields
- [x] Create `profiles` table (AC: 8)
  - [x] `id` uuid references auth.users(id)
  - [x] `name` text
  - [x] `role` text CHECK (role IN ('employee','manager'))
- [x] Write seed SQL for test users and profiles (AC: 7, 8)
  - [x] Use Supabase dashboard or `supabase/seed.sql` to insert auth users
  - [x] Insert corresponding profile rows
- [x] Document credentials in `docs/TEST_ACCOUNTS.md` (AC: 7)

## Dev Notes

- Supabase RLS: policies are additive (OR logic). Write one policy per operation per role — keeps them auditable.
- Manager role check in RLS: use a helper function or check `(SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'` — avoid putting business logic in raw policy SQL; use a stable `get_my_role()` function for performance.
- Seed users: Supabase does not let you set passwords via SQL directly in hosted projects. Use the Supabase Dashboard → Authentication → Users to create the two test users, then run a SQL snippet to insert their profiles. Document this in the setup steps.
- `user_metadata.role` on `auth.users` can be set via Supabase Admin API or dashboard — needed for middleware role detection (Story 1.1).
- Keep migration files idempotent with `CREATE TABLE IF NOT EXISTS` and `CREATE POLICY IF NOT EXISTS`.

### Project Structure Notes

```
supabase/
  migrations/
    001_schema.sql      ← leave_requests + profiles tables + RLS
  seed.sql              ← profile rows (auth users created via dashboard)
docs/
  TEST_ACCOUNTS.md      ← credentials for assessors
```

### References

- Supabase RLS guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase seed: https://supabase.com/docs/guides/local-development/seeding-your-database

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npx tsc --noEmit` — clean (×2: post-implementation, post-review patches)
- `npx eslint .` — clean
- `npx next build` — success; `/dashboard/manager` renders as Dynamic (ƒ) due to server-side role gate

### Completion Notes List

- **`CREATE POLICY IF NOT EXISTS` not valid Postgres syntax** — used `DROP POLICY IF EXISTS` + `CREATE POLICY` pattern for idempotency instead.
- **`get_my_role()` function order** — must be created after `profiles` table; used `SET check_function_bodies = OFF` to defer body validation during migration.
- **Auth user seeding** — Supabase hosted projects do not support setting passwords via `auth.users` SQL insert in the standard way. Used `crypt()` + `gen_salt('bf')` via MCP `execute_sql` (runs as postgres superuser), which works for development. For hosted re-seeding, use the Dashboard or Admin API as documented in `docs/TEST_ACCOUNTS.md` and `supabase/seed.sql`.
- **Role source moved from `user_metadata` to `app_metadata`** (HIGH deferred from Story 1.1) — `app_metadata` is not writable by end-users via `auth.updateUser`. Role is stored in `app_metadata.role` on `auth.users` and mirrored in `profiles.role` for RLS. Login action updated to read `app_metadata.role`.
- **Per-route role gate on `/dashboard/manager`** (HIGH deferred from Story 1.1) — `requireManagerRole()` added to `lib/auth.ts`; called at the top of the manager page RSC. Reads role from `profiles` table (authoritative, RLS-guarded). Unauthenticated → `/login`; authenticated non-manager → `/dashboard/employee`.
- **`get_my_role()` REVOKE** — Supabase security advisor flagged `anon`/`authenticated` roles could call this SECURITY DEFINER function via REST API. Revoked EXECUTE on both; added to migration file.
- **`CREATE POLICY IF NOT EXISTS`** is not standard Postgres SQL — the Dev Notes guidance was aspirational; the actual idempotent approach is `DROP POLICY IF EXISTS` + `CREATE POLICY`.
- **[Review patch] Employee INSERT policy** — original allowed inserting rows with `status='approved'` or review fields pre-set. Fixed: `WITH CHECK` now enforces `status='pending'`, `manager_comment IS NULL`, `reviewed_at IS NULL`, `reviewed_by IS NULL`.
- **[Review patch] Manager UPDATE policy** — original allowed changing any column. Fixed: `WITH CHECK` locks `employee_id`, `employee_name`, `type`, `start_date`, `end_date`, `reason`, `created_at` to their stored values via correlated subqueries; only review fields (`status`, `manager_comment`, `reviewed_at`, `reviewed_by`) can change.
- **[Review patch] seed.sql metadata dependency** — original read `raw_app_meta_data->>'role'` which is NULL for Dashboard-created users. Fixed: seed now uses explicit `(email, name, role)` VALUES joined on `auth.users.email` — no metadata dependency.
- **[Review patch] `/dashboard` page** — still read `user_metadata.role` after the 1.1 fix. Fixed: now calls `getSessionRole()` which reads from `profiles` table.
- **[Review patch] REVOKE scope** — `REVOKE ... FROM anon, authenticated` left the default PUBLIC grant in place. Fixed: `REVOKE EXECUTE ON FUNCTION get_my_role() FROM PUBLIC` covers all roles including future ones.
- **[Review patch] REVOKE broke policy evaluation** — revoking EXECUTE from PUBLIC (which includes `authenticated`) meant RLS policies invoking `get_my_role()` would fail for signed-in users. Fixed: moved helper to `internal` schema (not exposed by PostgREST) and granted `EXECUTE` + `USAGE` only to `authenticated`. All policies updated to `internal.get_my_role()`. Security advisor no longer flags the function.
- **[Review patch] Login routes from `app_metadata.role`** — unreliable for Dashboard-created users where `app_metadata` is not set. Fixed: login action now queries `profiles.role` directly after sign-in — same source as `getSessionRole()` and `requireManagerRole()`. Role routing is now consistent across all entry points.
- **[Review patch] Policies missing `TO authenticated`** — policies without a `TO` clause apply to PUBLIC; manager policies calling `internal.get_my_role()` would fail for `anon` requests with a permission error (no USAGE on `internal` schema) instead of silently returning no rows. Fixed: all policies now specify `TO authenticated`.
- **Stray zero-byte file `'role'\`` in repo root** — artefact from shell history; deleted before commit.

### File List

- `supabase/migrations/001_schema.sql` (new)
- `supabase/seed.sql` (new)
- `docs/TEST_ACCOUNTS.md` (new)
- `lib/auth.ts` (modified — added `getSessionRole`, `requireManagerRole`; role source → `app_metadata`)
- `app/(auth)/login/actions.ts` (modified — role read from `app_metadata.role`)
- `app/dashboard/manager/page.tsx` (modified — added `requireManagerRole()` gate)

## Change Log

| Date       | Change                                                                                   |
|------------|------------------------------------------------------------------------------------------|
| 2026-06-24 | Implemented Story 1.2: schema + RLS + seed + deferred HIGH items from 1.1. Status → review. |
| 2026-06-24 | Review patches: tightened INSERT/UPDATE policies, fixed seed metadata dependency, `/dashboard` role source, REVOKE scope. |
| 2026-06-24 | P1 fixes: moved get_my_role to internal schema (restores policy eval, removes REST exposure); login now routes from profiles.role. |
