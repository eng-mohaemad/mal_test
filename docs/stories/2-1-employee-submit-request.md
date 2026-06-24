---
baseline_commit: 8ce3712ca08161d04671e1e599565af6d7ce3d63
---

# Story 2.1: Employee — Submit Leave Request

Status: review

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

- [x] Build employee dashboard layout (AC: 1, 8)
  - [x] Header with user name + sign-out
  - [x] Collapsible "New Request" panel or modal trigger
- [x] Build leave request form (AC: 2, 3)
  - [x] Controlled form with React state (or useForm pattern)
  - [x] Leave type select
  - [x] Start/end date inputs with validation
  - [x] Optional reason textarea with char count
- [x] Wire form submit to Supabase insert (AC: 4)
  - [x] Use Server Action or client-side supabase insert
  - [x] Pass `employee_id` from session, `employee_name` from profile
- [x] Handle success and error states (AC: 5, 6, 7)
  - [x] Success: toast notification + form reset + list refresh
  - [x] Error: inline error message, preserve form data
- [x] Show request history list (built further in Story 2.2, placeholder here)

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

None — clean run, no blockers.

### Completion Notes List

- Server Action (`app/actions/leave.ts`) handles insert with server-side auth + validation; redirects to `?submitted=1` on success to prevent double-submit on back/refresh.
- `SuccessBanner` client component auto-clears the query param after 4s via `router.replace`.
- Client-side date validation uses native `min` attr + reactive `startDate` state to enforce end ≥ start without any library.
- `employeeName` sourced from `profiles` table in the RSC shell (server-controlled, not user-typed).
- `RequestList` is a stub — real implementation in Story 2.2.
- Build verified clean: `npx next build` passes, `npx tsc --noEmit` passes, ESLint passes.

### File List

- `app/dashboard/employee/page.tsx` — updated: RSC shell, fetches profile, passes name to form
- `app/dashboard/employee/NewRequestForm.tsx` — new: collapsible form, `useActionState`, date validation
- `app/dashboard/employee/RequestList.tsx` — new: stub placeholder
- `app/dashboard/employee/SuccessBanner.tsx` — new: success feedback, auto-clears `?submitted=1`
- `app/actions/leave.ts` — new: `submitLeaveRequest` Server Action

## Change Log

- 2026-06-24: Story 2.1 implemented — employee dashboard layout, leave request form, Server Action insert, success/error handling.
