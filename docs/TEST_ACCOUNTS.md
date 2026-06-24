# Test Accounts

Pre-seeded credentials for assessors and local development.

| Role     | Email               | Password   | Name         |
|----------|---------------------|------------|--------------|
| Employee | employee@test.com   | Test1234!  | Alex Johnson |
| Manager  | manager@test.com    | Test1234!  | Sam Rivera   |

## Login

Navigate to `/login` and sign in with either account.

- **Employee** is redirected to `/dashboard/employee`
- **Manager** is redirected to `/dashboard/manager`

Role is stored in `auth.users.app_metadata.role` (server-controlled — not editable by the user) and mirrored in the `profiles` table for RLS policy lookups.

## Re-seeding

If the database is reset, apply migrations in order first, then `supabase/seed.sql`:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_lr_insert_employee_only.sql
```  
Auth users must be re-created via the Supabase Dashboard → Authentication → Users (password: `Test1234!`, email confirmation off), then run `seed.sql` to insert the matching profile rows.
