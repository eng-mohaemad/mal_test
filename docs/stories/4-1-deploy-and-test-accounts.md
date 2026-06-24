# Story 4.1: Deploy to Vercel & Deliver Test Accounts

Status: in-review

## Story

As a **developer**,
I want the app deployed to Vercel with environment variables set and test accounts documented,
so that assessors can access the live URL and evaluate the app immediately.

## Acceptance Criteria

1. App is deployed to Vercel and accessible at a public HTTPS URL.
2. Vercel project has the following environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. The live URL loads the `/login` page by default (unauthenticated redirect).
4. Logging in as `employee@test.com` / `Test1234!` reaches the employee dashboard with 2–3 seeded requests visible.
5. Logging in as `manager@test.com` / `Test1234!` reaches the manager dashboard showing those requests.
6. Real-time updates work on the live deployment (Supabase Realtime connects over WSS).
7. A `docs/TEST_ACCOUNTS.md` file in the repo documents:
   - Live URL
   - Employee test credentials
   - Manager test credentials
   - A brief "How to demo" walkthrough (5 steps)
8. No build errors or TypeScript errors on the Vercel deployment.

## Tasks / Subtasks

- [x] Verify `next build` passes locally with no TS or lint errors (AC: 8)
- [x] Deploy via Vercel CLI or GitHub integration (AC: 1)
  - [x] `vercel --prod` → https://mal-test-pied.vercel.app
- [x] Set env vars in Vercel dashboard or via `vercel env add` (AC: 2)
- [x] Smoke test live URL (AC: 3–6)
  - [x] Root `/` redirects to `/login` — verified via Vercel MCP fetch (AC: 3)
  - [x] `/login` returns 200 with Sign-in form — verified via Vercel MCP fetch (AC: 3)
  - [ ] Employee login → seeded requests visible on dashboard — requires manual browser test (AC: 4)
  - [ ] Manager login → pending requests visible in queue — requires manual browser test (AC: 5)
  - [ ] Real-time update (manager approve → employee sees change without refresh) — requires manual browser test with incognito window (AC: 6)
- [x] Write `docs/TEST_ACCOUNTS.md` (AC: 7)
- [x] Seed 2–3 historical requests for employee test account so dashboard isn't empty on arrival (AC: 4, 5)
  - [x] Inserted via Supabase MCP: approved vacation, rejected sick, pending personal

## Dev Notes

- Vercel deploy: `vercel --prod` from the project root. Select the correct Vercel org/team if prompted.
- Environment variables: the Supabase **anon key** is safe to expose publicly (it's rate-limited and RLS-protected). The service role key must NEVER be added to Vercel env vars — it's only used in local seed scripts.
- Realtime over WSS: Vercel edge/serverless functions don't maintain persistent connections, but Supabase Realtime is a client-side WebSocket — it connects from the browser, not the server. No special Vercel config needed.
- `next build` check: run `npx tsc --noEmit` before deploying to catch type errors early.
- Seed data for demo: insert 2–3 requests for `employee@test.com` directly in Supabase SQL editor — mix of pending, approved, and rejected statuses for a realistic demo.

### Demo Seed SQL (run in Supabase SQL editor)

```sql
-- Insert demo requests for employee@test.com
-- Replace EMPLOYEE_UUID with the actual uuid from auth.users
INSERT INTO leave_requests (employee_id, employee_name, type, start_date, end_date, reason, status, manager_comment, reviewed_at)
VALUES
  ('EMPLOYEE_UUID', 'Mohammad Baker', 'vacation',   '2025-08-04', '2025-08-08', 'Family holiday', 'approved', 'Enjoy!', now() - interval '2 days'),
  ('EMPLOYEE_UUID', 'Mohammad Baker', 'sick',        '2025-07-01', '2025-07-02', null,             'rejected', 'Please provide a doctors note next time.', now() - interval '10 days'),
  ('EMPLOYEE_UUID', 'Mohammad Baker', 'personal',    '2025-09-15', '2025-09-15', 'Personal errand', 'pending', null, null);
```

### Project Structure Notes

```
docs/
  TEST_ACCOUNTS.md    ← live URL + credentials + how-to-demo
.env.example          ← template for local dev (no real values)
```

### References

- Vercel CLI deploy: https://vercel.com/docs/cli/deploy
- Vercel env vars: https://vercel.com/docs/projects/environment-variables

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Build clean: `next build` + `tsc --noEmit` both pass with zero errors.
- Deployed via `vercel --prod`; canonical alias: https://mal-test-pied.vercel.app
- Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) were already present in Vercel for Production + Preview.
- Demo seed inserted directly via Supabase MCP (project `ectgfhiknkzklshifokt`): 3 rows for employee UUID `5c3ccf45-1026-4367-92b3-780ff7133d76` — approved vacation, rejected sick, pending personal. Two pre-existing E2E rows left in place (no harm to demo).
- Automated smoke test (Vercel MCP fetch): root `/` and `/login` both return 200 with login form; middleware redirect confirmed via `x-matched-path: /login` (AC3).
- AC4, AC5, AC6 (authenticated flows and realtime) require manual browser verification — automated fetch cannot authenticate. The underlying seeded data is confirmed in DB; app logic was tested in Epics 2–3.
- Realtime (AC6) uses client-side WSS to Supabase — no Vercel config needed. For the demo, use an incognito window for the employee tab; same-origin tabs share the Supabase auth session.

### File List

- docs/TEST_ACCOUNTS.md (updated: live URL + 5-step how-to-demo)
- docs/stories/4-1-deploy-and-test-accounts.md (status → done, tasks checked)
