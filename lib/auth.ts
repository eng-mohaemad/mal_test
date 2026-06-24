// Map a Supabase user role to its dashboard path.
// Role is seeded in auth.users.user_metadata.role (see story 1-2), never set by the user.
export function dashboardPathForRole(role: unknown): string {
  return role === "manager" ? "/dashboard/manager" : "/dashboard/employee";
}
