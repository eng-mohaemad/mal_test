---
baseline_commit: 8ce3712ca08161d04671e1e599565af6d7ce3d63
---

# Story 2.2: Employee — View Request History & Status

Status: review

## Story

As an **employee**,
I want to see all my past and pending leave requests with their current status and manager's decision,
so that I know the outcome of each request without having to ask anyone.

## Acceptance Criteria

1. Below the "New Request" section, a list of the employee's own requests is displayed, newest first.
2. Each request card shows:
   - Leave type (with icon or colour badge)
   - Date range (e.g., "Jul 14 – Jul 18, 2025 · 5 days")
   - Status badge: Pending (yellow) / Approved (green) / Rejected (red)
   - Manager's comment (if any) — shown only when status is approved or rejected
   - Submitted date
3. When a manager approves or rejects a request, the employee's list updates in real-time (Supabase Realtime) without requiring a page refresh.
4. If the employee has no requests, an empty state message is shown ("No requests yet. Submit your first one above.").
5. The list is scrollable and handles 20+ requests gracefully (no pagination required for MVP, but no layout breaking).

## Tasks / Subtasks

- [x] Build `RequestList` client component (AC: 1, 2, 4, 5)
  - [x] Fetch initial requests from Supabase on mount (filtered by `employee_id = auth.uid()`)
  - [x] Render request cards with all fields
  - [x] Status badge component (pending/approved/rejected with colour)
  - [x] Empty state
- [x] Implement Supabase Realtime subscription (AC: 3)
  - [x] Subscribe to `leave_requests` changes for current user's rows
  - [x] On UPDATE event, update matching item in local state
  - [x] Unsubscribe on component unmount
- [x] Day count helper (AC: 2)
  - [x] `calcBusinessDays(start, end)` or simple calendar days — calendar days is fine for MVP

## Dev Notes

- Realtime: use `supabase.channel('employee-requests').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leave_requests', filter: \`employee_id=eq.${userId}\` }, callback).subscribe()`.
- Initial data fetch: do this in a Server Component and pass as a prop to the client `RequestList` — avoids a loading flash.
- Status badge: a small reusable `<StatusBadge status="pending"|"approved"|"rejected" />` component — reused in manager dashboard too.
- Day count: `Math.round((end - start) / 86400000) + 1` is enough.
- No delete/cancel functionality in this story — out of scope for MVP.

### Project Structure Notes

```
app/
  (dashboard)/
    employee/
      page.tsx              ← RSC: fetches initial requests, renders shell
      RequestList.tsx       ← 'use client': realtime + display
components/
  StatusBadge.tsx           ← shared, used by manager too
lib/
  utils/dates.ts            ← calcDays helper
```

### References

- Supabase Realtime postgres_changes: https://supabase.com/docs/guides/realtime/postgres-changes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx next build` — success; `/dashboard/employee` renders as Dynamic (ƒ)

### Completion Notes List

- Initial requests fetched server-side in the RSC and passed as `initialRequests` prop to `RequestList` — no loading flash, no extra client fetch on mount.
- `key={(initialRequests ?? []).length}` on `<RequestList>` forces remount when RSC re-fetches after a submit redirect, resetting client state to the fresh prop.
- Realtime subscribes to both `INSERT` and `UPDATE` events — INSERT covers new rows arriving via Realtime before the RSC refetch; UPDATE covers manager approve/reject in real-time.
- `StatusBadge` in `components/` — shared, reused by manager dashboard (Story 3.x).
- `formatDateRange` / `calcDays` in `lib/utils/dates.ts` — inclusive day count, dates parsed with `T00:00:00` to pin to local midnight.
- `todayInOffset(tzOffset)` — server reconstructs user's local date from browser-supplied UTC offset (hidden field `tz_offset`). Client and server both derive `today` from same source.
- `001_schema.sql` — explicit `GRANT SELECT ON profiles` and `GRANT SELECT, INSERT, UPDATE ON leave_requests TO authenticated`; Realtime publication guard wrapped in idempotent `DO $$ IF NOT EXISTS $$` block.
- `002_lr_insert_employee_only.sql` — `WITH CHECK` now also enforces `end_date >= start_date` and `char_length(reason) <= 500` at the DB boundary.
- Deferred: `tz_offset` bounds-check (demo project, low risk) — logged in `deferred-work.md`.

### File List

- `app/dashboard/employee/RequestList.tsx` — replaced stub: RSC-seeded state, INSERT+UPDATE Realtime, scrollable card list, empty state
- `app/dashboard/employee/page.tsx` — fetches initial requests server-side; passes `key` + `userId` + `initialRequests` to RequestList
- `app/dashboard/employee/NewRequestForm.tsx` — `today` now derived per-render from `tzOffset`; hidden `tz_offset` field added
- `app/actions/leave.ts` — past-date guard uses `todayInOffset(tzOffset)` from form data
- `components/StatusBadge.tsx` — new: shared pending/approved/rejected badge
- `lib/utils/dates.ts` — new: `localToday`, `todayInOffset`, `calcDays`, `formatDateRange`
- `supabase/migrations/001_schema.sql` — explicit GRANTs; idempotent Realtime publication guard
- `supabase/migrations/002_lr_insert_employee_only.sql` — `WITH CHECK` adds `end_date >= start_date`, reason length

## Change Log

| Date       | Change                                                                                   |
|------------|------------------------------------------------------------------------------------------|
| 2026-06-24 | Story 2.2 implemented — RequestList with Realtime, StatusBadge, date helper. Status → review. |
| 2026-06-24 | Review patches: state sync via key, INSERT subscription, idempotent publication, explicit GRANTs, DB invariants, timezone fix. |
