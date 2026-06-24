import { redirect } from "next/navigation";
import { getSessionRole, dashboardPathForRole } from "@/lib/auth";

// Bare /dashboard has no UI of its own — send the user to their role's dashboard.
// Reads role from profiles table (authoritative); proxy.ts guarantees a session exists here.
export default async function DashboardIndex() {
  const role = await getSessionRole();
  redirect(dashboardPathForRole(role));
}
