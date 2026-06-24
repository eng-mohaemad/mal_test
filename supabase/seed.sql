-- ============================================================
-- seed.sql — test user profiles
-- ============================================================
-- IMPORTANT: Auth users must exist before running this file.
--
-- Option A (development): Auth users were inserted directly via SQL superuser
-- with app_metadata pre-set (already done for this project).
--
-- Option B (hosted re-seed): Create the two users in the Supabase Dashboard →
-- Authentication → Users with password "Test1234!" and email confirmation
-- disabled. app_metadata is NOT set by the dashboard UI, so this seed file
-- uses explicit values keyed by email — it does not depend on metadata.
--
-- This file is idempotent (safe to re-run).

INSERT INTO public.profiles (id, name, role)
SELECT
  u.id,
  v.name,
  v.role
FROM auth.users u
JOIN (VALUES
  ('employee@test.com', 'Mohammad Baker',    'employee'),
  ('manager@test.com',  'Abdallah Abu-Sheikh', 'manager')
) AS v(email, name, role) ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
