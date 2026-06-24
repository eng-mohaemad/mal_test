import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewRequestForm from "./NewRequestForm";
import RequestList, { type LeaveRequest } from "./RequestList";
import SuccessBanner from "./SuccessBanner";

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "manager") redirect("/dashboard/manager");

  const employeeName = profile?.name ?? user.email ?? "Employee";
  const params = await searchParams;

  const { data: initialRequests } = await supabase
    .from("leave_requests")
    .select("id, type, start_date, end_date, reason, status, manager_comment, created_at")
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {employeeName}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your leave requests below.</p>
      </div>

      {params.submitted === "1" && <SuccessBanner />}

      <NewRequestForm />
      <RequestList
        key={(initialRequests ?? []).length}
        userId={user.id}
        initialRequests={(initialRequests ?? []) as LeaveRequest[]}
      />
    </div>
  );
}
