# Story 3.1: Manager — Review Queue (Pending Requests)

Status: done

## Story

As a **manager**,
I want to see all pending leave requests in a clear queue,
so that I can quickly identify what needs my attention and act on it.

## Acceptance Criteria

1. The manager dashboard (`/dashboard/manager`) loads with a "Pending Requests" section at the top.
2. Each pending request card shows:
   - Employee name
   - Leave type badge
   - Date range + day count
   - Reason (if provided), truncated to 2 lines with expand option
   - Submitted date ("3 hours ago" style relative time)
   - "Approve" (green) and "Reject" (red) action buttons
3. When a new request is submitted by an employee, it appears in the pending queue in real-time (Supabase Realtime) without a page refresh.
4. If there are no pending requests, an empty state is shown: "All caught up — no pending requests."
5. Pending requests are sorted oldest-first (FIFO — act on what's been waiting longest).
6. After taking an action (approve/reject), the card is removed from the pending queue immediately (optimistic UI).

## Tasks / Subtasks

- [ ] Build manager dashboard layout (AC: 1, 4)
  - [ ] Header with manager name + sign-out
  - [ ] "Pending Requests" section with count badge
  - [ ] Empty state
- [ ] Build `PendingQueue` client component (AC: 2, 5, 6)
  - [ ] Fetch initial pending requests (status = 'pending') on server, pass as prop
  - [ ] Request card with all fields
  - [ ] Relative time display (use `Intl.RelativeTimeFormat` or simple helper)
  - [ ] Expandable reason text
  - [ ] Approve / Reject buttons (wired in Story 3.2)
- [ ] Supabase Realtime for new requests (AC: 3)
  - [ ] Subscribe to INSERT events on `leave_requests` where `status = 'pending'`
  - [ ] Prepend new card to queue (or append — keep FIFO order)

## Dev Notes

- Realtime filter for INSERT: `filter: 'status=eq.pending'` on the channel.
- Optimistic removal (AC: 6): remove card from local state immediately on approve/reject click, before the server confirms — add back on error.
- Relative time: `Intl.RelativeTimeFormat` is built-in to modern browsers. Helper: pick the right unit (minutes/hours/days) based on diff.
- Card layout: horizontal on desktop (name + dates left, actions right), stacked on mobile.
- Reuse `StatusBadge` from Story 2.2.

### Project Structure Notes

```
app/
  (dashboard)/
    manager/
      page.tsx              ← RSC: fetches pending + history, passes to client
      PendingQueue.tsx      ← 'use client': realtime + optimistic UI
      RequestCard.tsx       ← shared card for pending and history views
components/
  StatusBadge.tsx           ← (already created in 2.2)
lib/
  utils/time.ts             ← relativeTime() helper
```

### References

- Supabase Realtime INSERT filter: https://supabase.com/docs/guides/realtime/postgres-changes#filtering-for-events
- Intl.RelativeTimeFormat MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Manager page now RSC: fetches pending requests (FIFO) and profile, passes to PendingQueue client component.
- Realtime subscription on `postgres_changes` INSERT with `filter: 'status=eq.pending'` appends to queue tail.
- Empty state renders "All caught up — no pending requests." when queue length is 0.
- Expandable reason text via `line-clamp-2` + toggle; relative time via `Intl.RelativeTimeFormat` in `lib/utils/time.ts`.
- Action buttons wired in Story 3.2 via `DecisionPanel` (co-located in same route segment).
- Post-review: code review passed; RLS tightened in migration 003, zero-row detection added to server action, toast timing fixed (fires only after server confirms success).

### File List

- app/dashboard/manager/page.tsx
- app/dashboard/manager/PendingQueue.tsx
- app/dashboard/manager/DecisionPanel.tsx
- lib/utils/time.ts
