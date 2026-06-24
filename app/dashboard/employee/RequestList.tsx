"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { formatDateRange } from "@/lib/utils/dates";

export type LeaveRequest = {
  id: string;
  type: "vacation" | "sick" | "personal";
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  manager_comment: string | null;
  created_at: string;
};

const typeLabel: Record<LeaveRequest["type"], string> = {
  vacation: "🌴 Vacation",
  sick:     "🤒 Sick Leave",
  personal: "👤 Personal",
};

export default function RequestList({
  userId,
  initialRequests,
}: {
  userId: string;
  initialRequests: LeaveRequest[];
}) {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("employee-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leave_requests",
          filter: `employee_id=eq.${userId}`,
        },
        (payload) => {
          setRequests((prev) => [payload.new as LeaveRequest, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leave_requests",
          filter: `employee_id=eq.${userId}`,
        },
        (payload) => {
          setRequests((prev) =>
            prev.map((r) =>
              r.id === payload.new.id ? (payload.new as LeaveRequest) : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (requests.length === 0) {
    return (
      <div className="rounded-[24px] border border-black/10 bg-white px-5 py-8 text-center">
        <p className="text-sm text-zinc-500">
          No requests yet. Submit your first one above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-black/10 bg-white divide-y divide-black/5">
      <h2 className="px-5 py-4 text-sm font-semibold">My Requests</h2>
      <ul className="divide-y divide-black/5 max-h-[32rem] overflow-y-auto">
        {requests.map((r) => (
          <li key={r.id} className="px-5 py-4 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{typeLabel[r.type]}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-zinc-500">{formatDateRange(r.start_date, r.end_date)}</p>
            {(r.status === "approved" || r.status === "rejected") && r.manager_comment && (
              <p className="text-sm italic text-zinc-500">
                Manager: {r.manager_comment}
              </p>
            )}
            <p className="text-xs text-zinc-400">
              Submitted{" "}
              {new Date(r.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
