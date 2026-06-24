-- Tighten lr_manager_update: only pending→approved/rejected, reviewed_by must be caller.
DROP POLICY IF EXISTS "lr_manager_update" ON leave_requests;

CREATE POLICY "lr_manager_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    internal.get_my_role() = 'manager'
    AND status = 'pending'               -- old row must be pending
  )
  WITH CHECK (
    internal.get_my_role() = 'manager'
    AND status IN ('approved', 'rejected') -- new status must be a decision
    AND reviewed_by = auth.uid()           -- manager cannot spoof reviewer
    AND employee_id   = (SELECT lr.employee_id   FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND employee_name = (SELECT lr.employee_name FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND type          = (SELECT lr.type          FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND start_date    = (SELECT lr.start_date    FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND end_date      = (SELECT lr.end_date      FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND reason IS NOT DISTINCT FROM (SELECT lr.reason FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND created_at    = (SELECT lr.created_at    FROM leave_requests lr WHERE lr.id = leave_requests.id)
  );
