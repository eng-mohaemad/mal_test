# Story 3.2: Manager — Approve or Reject a Request

Status: ready-for-dev

## Story

As a **manager**,
I want to approve or reject a leave request with an optional comment,
so that the employee is informed of my decision with context.

## Acceptance Criteria

1. Clicking "Approve" on a pending request card opens an inline confirmation panel (not a separate page) showing:
   - Summary of the request (employee, dates, type)
   - Optional comment textarea ("Add a note (optional)")
   - "Confirm Approval" and "Cancel" buttons
2. Clicking "Reject" opens the same inline panel but labelled for rejection, with the comment textarea still optional.
3. On confirm, the `leave_requests` row is updated:
   - `status` → `'approved'` or `'rejected'`
   - `manager_comment` → comment text (or null)
   - `reviewed_at` → current timestamp
   - `reviewed_by` → manager's `auth.uid()`
4. The request card disappears from the pending queue immediately (optimistic UI from Story 3.1).
5. A success toast confirms the action: "Request approved" / "Request rejected".
6. If the update fails, an error message is shown, the card is restored to the queue, and the panel stays open.
7. The updated request appears in the "Request History" section (Story 3.3) with the new status.
8. Manager cannot approve/reject an already-decided request (the action buttons are not shown on non-pending cards).

## Tasks / Subtasks

- [ ] Build inline decision panel component (AC: 1, 2, 8)
  - [ ] Toggle open/closed state per card
  - [ ] Request summary display
  - [ ] Optional comment textarea
  - [ ] Confirm / Cancel buttons with loading state
- [ ] Wire to Server Action `reviewLeaveRequest(id, decision, comment)` (AC: 3)
  - [ ] Update `status`, `manager_comment`, `reviewed_at`, `reviewed_by`
  - [ ] Use Supabase server client (session from cookie)
- [ ] Handle optimistic UI and error recovery (AC: 4, 6)
  - [ ] Remove card optimistically on confirm click
  - [ ] Restore on error + show error message
- [ ] Success feedback (AC: 5)
  - [ ] Green toast for approve, neutral/grey for reject

## Dev Notes

- Server Action: `reviewLeaveRequest` in `actions/leave.ts`. It receives `(requestId: string, decision: 'approved' | 'rejected', comment: string | null)`.
- The update must use the **server-side Supabase client** so RLS uses the manager's session (not the service role key).
- Inline panel: an absolutely-positioned div or a conditional render below the card — no modal library needed.
- Do NOT use service role key for this update — the RLS policy for manager UPDATE handles authorization. Using service role would bypass all security.
- Loading state: disable buttons and show spinner inside "Confirm" button during the async action.
- `reviewed_by`: get from `supabase.auth.getUser()` in the Server Action.

### Project Structure Notes

```
app/
  (dashboard)/
    manager/
      PendingQueue.tsx      ← contains DecisionPanel as inline child
      DecisionPanel.tsx     ← 'use client': confirm/cancel UI
actions/
  leave.ts                  ← reviewLeaveRequest() added here
```

### References

- Supabase RLS UPDATE policy: manager can update status fields only (defined in Story 1.2 migration)
- Next.js Server Actions with form state: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#server-side-form-validation

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
