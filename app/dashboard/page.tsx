import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole } from "@/lib/auth";

// Bare /dashboard has no UI of its own — send the user to their role's dashboard.
// (proxy.ts already guarantees a session exists here.)
export default async function DashboardIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(dashboardPathForRole(user?.user_metadata?.role));
}
