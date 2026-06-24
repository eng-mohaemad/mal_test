# Test Accounts

Pre-seeded credentials for assessors and local development.

## Live URL

**https://mal-test-pied.vercel.app**

---

## Credentials

| Role     | Email               | Password   | Name         |
|----------|---------------------|------------|--------------|
| Employee | employee@test.com   | Test1234!  | Mohammad Baker       |
| Manager  | manager@test.com    | Test1234!  | Abdallah Abu-Sheikh  |

---

## How to Demo (5 steps)

1. **Open the app** — navigate to the live URL above. You are redirected to `/login`.
2. **Employee flow** — log in as `employee@test.com` / `Test1234!`. You land on the employee dashboard showing 2–3 seeded leave requests (one approved, one rejected, one pending).
3. **Submit a new request** — click "New Request", fill in dates and type, and submit. The new request appears at the top of the list with status *Pending*.
4. **Manager review** — log out, then log in as `manager@test.com` / `Test1234!`. You land on the manager queue. The newly submitted request is visible. Click Approve or Reject (with an optional comment).
5. **Real-time update** — open an incognito window (or a different browser profile) and log in as `employee@test.com`. Without refreshing, the status of the request changes live as soon as the manager acts on it. (A regular second tab shares the same Supabase auth session, so both tabs would be logged in as the same user.)

---

## Login Routing

- **Employee** is redirected to `/dashboard/employee`
- **Manager** is redirected to `/dashboard/manager`

Role is stored in `auth.users.app_metadata.role` (server-controlled — not editable by the user) and mirrored in the `profiles` table for RLS policy lookups.

---

## Re-seeding

If the database is reset, apply migrations in order first, then `supabase/seed.sql`:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_lr_insert_employee_only.sql
```

Auth users must be re-created via the Supabase Dashboard → Authentication → Users (password: `Test1234!`, email confirmation off), then run `seed.sql` to insert the matching profile rows.

To re-insert demo leave requests for the employee account, run the SQL in `docs/stories/4-1-deploy-and-test-accounts.md` → "Demo Seed SQL" against the production Supabase project (replace `EMPLOYEE_UUID` with the actual UUID from `auth.users`).
