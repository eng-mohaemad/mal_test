import { requireManagerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PendingQueue, { type PendingRequest } from "./PendingQueue";

export default async function ManagerDashboardPage() {
  await requireManagerRole();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: pending } = await supabase
    .from("leave_requests")
    .select("id, employee_id, employee_name, type, start_date, end_date, reason, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true }); // FIFO: oldest first

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {profile?.name ?? "Manager"}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Review and action pending leave requests.</p>
      </div>

      <PendingQueue initialRequests={(pending ?? []) as PendingRequest[]} />
    </div>
  );
}
