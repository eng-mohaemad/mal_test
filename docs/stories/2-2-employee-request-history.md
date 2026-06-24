# Story 2.2: Employee — View Request History & Status

Status: ready-for-dev

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

- [ ] Build `RequestList` client component (AC: 1, 2, 4, 5)
  - [ ] Fetch initial requests from Supabase on mount (filtered by `employee_id = auth.uid()`)
  - [ ] Render request cards with all fields
  - [ ] Status badge component (pending/approved/rejected with colour)
  - [ ] Empty state
- [ ] Implement Supabase Realtime subscription (AC: 3)
  - [ ] Subscribe to `leave_requests` changes for current user's rows
  - [ ] On UPDATE event, update matching item in local state
  - [ ] Unsubscribe on component unmount
- [ ] Day count helper (AC: 2)
  - [ ] `calcBusinessDays(start, end)` or simple calendar days — calendar days is fine for MVP

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

### Completion Notes List

### File List
