import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Map a role string to its dashboard path.
// Role lives in app_metadata (server-controlled, not writable by the user).
export function dashboardPathForRole(role: unknown): string {
  return role === "manager" ? "/dashboard/manager" : "/dashboard/employee";
}

// Read the current user's role from the profiles table (authoritative server-side source).
// Returns null if unauthenticated or no profile row exists.
export async function getSessionRole(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role ?? null;
}

// Redirect to /login if not authenticated, or to /dashboard/employee if not a manager.
export async function requireManagerRole(): Promise<void> {
  const role = await getSessionRole();
  if (!role) redirect("/login");
  if (role !== "manager") redirect("/dashboard/employee");
}
