-- Tighten lr_employee_insert: only users with role='employee' may insert.
-- Managers redirected by UI but Server Actions and direct API calls are reachable.
-- Also enforces relational invariants that cannot be checked client-side:
--   end_date >= start_date, reason <= 500 chars.
-- Past-date guard stays in the Server Action (requires client timezone).
DROP POLICY IF EXISTS "lr_employee_insert" ON leave_requests;

CREATE POLICY "lr_employee_insert"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND internal.get_my_role() = 'employee'
    AND status = 'pending'
    AND manager_comment IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND end_date >= start_date
    AND (reason IS NULL OR char_length(reason) <= 500)
  );
