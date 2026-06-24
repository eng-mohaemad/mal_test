# Story 1.2: Supabase Schema, RLS Policies & Seed Data

Status: ready-for-dev

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

- [ ] Write migration SQL for `leave_requests` table (AC: 1)
- [ ] Enable RLS and write policies (AC: 2–6)
  - [ ] Employee SELECT own rows
  - [ ] Employee INSERT own rows
  - [ ] Manager SELECT all rows
  - [ ] Manager UPDATE status fields
- [ ] Create `profiles` table (AC: 8)
  - [ ] `id` uuid references auth.users(id)
  - [ ] `name` text
  - [ ] `role` text CHECK (role IN ('employee','manager'))
- [ ] Write seed SQL for test users and profiles (AC: 7, 8)
  - [ ] Use Supabase dashboard or `supabase/seed.sql` to insert auth users
  - [ ] Insert corresponding profile rows
- [ ] Document credentials in `docs/TEST_ACCOUNTS.md` (AC: 7)

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

### Completion Notes List

### File List
