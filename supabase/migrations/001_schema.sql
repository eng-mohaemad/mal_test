-- ============================================================
-- 001_schema.sql  — leave_requests + profiles tables + RLS
-- ============================================================
-- Idempotent: safe to re-apply (CREATE TABLE IF NOT EXISTS,
-- CREATE OR REPLACE FUNCTION, DROP POLICY IF EXISTS).

SET check_function_bodies = OFF;

-- ── internal schema (not exposed by PostgREST) ──────────────
CREATE SCHEMA IF NOT EXISTS internal;

-- ── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name  text NOT NULL,
  role  text NOT NULL CHECK (role IN ('employee', 'manager'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON profiles TO authenticated;

-- Helper: stable role lookup per auth.uid().
-- Lives in `internal` schema so PostgREST never exposes it as an RPC endpoint.
-- SECURITY DEFINER so it reads profiles bypassing the caller's RLS context.
CREATE OR REPLACE FUNCTION internal.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT USAGE   ON SCHEMA internal                  TO authenticated;
GRANT EXECUTE ON FUNCTION internal.get_my_role()  TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_select_manager" ON profiles;

-- TO authenticated: anon requests see no rows rather than a permission error.
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_manager"
  ON profiles FOR SELECT
  TO authenticated
  USING (internal.get_my_role() = 'manager');

-- ── leave_requests ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid        NOT NULL REFERENCES auth.users(id),
  employee_name    text        NOT NULL,
  type             text        NOT NULL CHECK (type IN ('vacation', 'sick', 'personal')),
  start_date       date        NOT NULL,
  end_date         date        NOT NULL,
  reason           text,
  status           text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_comment  text,
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON leave_requests TO authenticated;

-- Enable Realtime for this table so postgres_changes subscriptions receive manager UPDATEs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leave_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
  END IF;
END $$;

DROP POLICY IF EXISTS "lr_employee_select" ON leave_requests;
DROP POLICY IF EXISTS "lr_employee_insert" ON leave_requests;
DROP POLICY IF EXISTS "lr_manager_select"  ON leave_requests;
DROP POLICY IF EXISTS "lr_manager_update"  ON leave_requests;

-- Employee: SELECT own rows (AC 3)
CREATE POLICY "lr_employee_select"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Employee: INSERT own rows; status must be 'pending', no review fields pre-set (AC 3)
CREATE POLICY "lr_employee_insert"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'pending'
    AND manager_comment IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
  );

-- Manager: SELECT all rows (AC 4)
CREATE POLICY "lr_manager_select"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (internal.get_my_role() = 'manager');

-- Manager: UPDATE only review fields — immutable columns locked via correlated subqueries (AC 5).
-- Employees have no UPDATE policy, satisfying AC 6 by omission.
CREATE POLICY "lr_manager_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (internal.get_my_role() = 'manager')
  WITH CHECK (
    internal.get_my_role() = 'manager'
    AND employee_id   = (SELECT lr.employee_id   FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND employee_name = (SELECT lr.employee_name FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND type          = (SELECT lr.type          FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND start_date    = (SELECT lr.start_date    FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND end_date      = (SELECT lr.end_date      FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND reason IS NOT DISTINCT FROM (SELECT lr.reason FROM leave_requests lr WHERE lr.id = leave_requests.id)
    AND created_at    = (SELECT lr.created_at    FROM leave_requests lr WHERE lr.id = leave_requests.id)
  );
