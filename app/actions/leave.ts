"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInOffset } from "@/lib/utils/dates";

export type LeaveRequestState = { error: string | null };

export async function submitLeaveRequest(
  _prevState: LeaveRequestState,
  formData: FormData
): Promise<LeaveRequestState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const type = String(formData.get("type") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const tzOffset = parseInt(String(formData.get("tz_offset") ?? "0"), 10) || 0;

  if (!type || !startDate || !endDate) {
    return { error: "Leave type, start date, and end date are required." };
  }

  const today = todayInOffset(tzOffset);
  if (startDate < today) {
    return { error: "Start date must be today or in the future." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after start date." };
  }
  if (reason && reason.length > 500) {
    return { error: "Reason must be 500 characters or fewer." };
  }

  // Fetch name from profiles server-side — not from form data (client-controlled)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "employee") {
    return { error: "Only employees may submit leave requests." };
  }

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: user.id,
    employee_name: profile.name,
    type,
    start_date: startDate,
    end_date: endDate,
    reason,
    status: "pending",
  });

  if (error) {
    return { error: "Failed to submit request. Please try again." };
  }

  // Redirect with success signal — avoids double-submit on browser refresh
  redirect("/dashboard/employee?submitted=1");
}

export async function reviewLeaveRequest(
  requestId: string,
  decision: "approved" | "rejected",
  comment: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status:          decision,
      manager_comment: comment || null,
      reviewed_at:     new Date().toISOString(),
      reviewed_by:     user.id,
    })
    .eq("id", requestId)
    .eq("status", "pending") // guard: only pending rows can be updated
    .select("id");

  if (error) return { error: "Failed to save decision. Please try again." };
  if (!data?.length) return { error: "Request was already decided by another manager." };
  return { error: null };
}
