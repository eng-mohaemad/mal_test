# Story 2.1: Employee — Submit Leave Request

Status: ready-for-dev

## Story

As an **employee**,
I want to fill in and submit a leave request form,
so that my manager is notified and can review my time-off request.

## Acceptance Criteria

1. The employee dashboard (`/dashboard/employee`) shows a "New Request" button/section prominently.
2. The form collects:
   - Leave type: dropdown — Vacation / Sick Leave / Personal
   - Start date: date picker (must be today or future)
   - End date: date picker (must be ≥ start date)
   - Reason: optional textarea (max 500 chars)
3. Client-side validation prevents submission if start > end or dates are in the past.
4. On submit, a row is inserted into `leave_requests` with `status = 'pending'` and `employee_id = current user`.
5. After successful submission, a success toast/banner appears and the form resets.
6. The new request appears immediately in the employee's request history list (below the form) without a page refresh.
7. If the insert fails (network error, RLS violation), an error message is shown and the form data is preserved.
8. The "New Request" form is collapsible/modal so it doesn't dominate the history view after submission.

## Tasks / Subtasks

- [ ] Build employee dashboard layout (AC: 1, 8)
  - [ ] Header with user name + sign-out
  - [ ] Collapsible "New Request" panel or modal trigger
- [ ] Build leave request form (AC: 2, 3)
  - [ ] Controlled form with React state (or useForm pattern)
  - [ ] Leave type select
  - [ ] Start/end date inputs with validation
  - [ ] Optional reason textarea with char count
- [ ] Wire form submit to Supabase insert (AC: 4)
  - [ ] Use Server Action or client-side supabase insert
  - [ ] Pass `employee_id` from session, `employee_name` from profile
- [ ] Handle success and error states (AC: 5, 6, 7)
  - [ ] Success: toast notification + form reset + list refresh
  - [ ] Error: inline error message, preserve form data
- [ ] Show request history list (built further in Story 2.2, placeholder here)

## Dev Notes

- Use a **Server Action** for the insert — keeps auth token server-side, avoids exposing service key to client.
- `employee_name` should be read from the `profiles` table at session time, not typed by the user.
- Date inputs: use native `<input type="date">` — no date-picker library needed, keeps bundle small.
- Success feedback: a simple top-of-page green banner or Tailwind toast div is fine — no toast library.
- Form state: plain `useState` hooks are sufficient; no form library (react-hook-form etc.) needed for this scope.
- The insert triggers Supabase Realtime for the manager dashboard (Story 3.1) — no extra work needed here.

### Project Structure Notes

```
app/
  (dashboard)/
    employee/
      page.tsx              ← RSC shell, passes session to client
      NewRequestForm.tsx    ← 'use client' form component
      RequestList.tsx       ← request history (stub, completed in 2.2)
actions/
  leave.ts                  ← submitLeaveRequest() Server Action
```

### References

- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Supabase insert with RLS: uses anon key + session cookie automatically via SSR client

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
