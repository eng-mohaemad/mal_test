"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { formatDateRange } from "@/lib/utils/dates";
import { relativeTime } from "@/lib/utils/time";
import DecisionPanel from "./DecisionPanel";

export type PendingRequest = {
  id: string;
  employee_id: string;
  employee_name: string;
  type: "vacation" | "sick" | "personal";
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending";
  created_at: string;
};

const typeLabel: Record<PendingRequest["type"], string> = {
  vacation: "🌴 Vacation",
  sick:     "🤒 Sick Leave",
  personal: "👤 Personal",
};

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 text-sm shadow-lg">
      {message}
    </div>
  );
}

export default function PendingQueue({
  initialRequests,
}: {
  initialRequests: PendingRequest[];
}) {
  const [queue,       setQueue]       = useState<PendingRequest[]>(initialRequests);
  const [toast,       setToast]       = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // per-card error message — survives optimistic remove + restore
  const [cardErrors,  setCardErrors]  = useState<Record<string, string>>({});
  const stash = useRef<Map<string, { item: PendingRequest; idx: number }>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("manager-pending")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leave_requests", filter: "status=eq.pending" },
        (payload) => {
          setQueue((prev) => [...prev, payload.new as PendingRequest]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function optimisticRemove(id: string) {
    setQueue((prev) => {
      const idx  = prev.findIndex((r) => r.id === id);
      const item = prev[idx];
      if (item) stash.current.set(id, { item, idx });
      return prev.filter((r) => r.id !== id);
    });
    // clear any previous error for this card
    setCardErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function restoreCard(id: string, errMsg: string) {
    const entry = stash.current.get(id);
    if (!entry) return;
    stash.current.delete(id);
    setQueue((prev) => {
      const next = [...prev];
      next.splice(entry.idx, 0, entry.item);
      return next;
    });
    // store the error so the freshly-mounted card receives it as a prop
    setCardErrors((prev) => ({ ...prev, [id]: errMsg }));
  }

  function handleConfirm(id: string) {
    optimisticRemove(id);
  }

  function handleSuccess(id: string, decision: "approved" | "rejected") {
    // card already removed optimistically; just show toast
    stash.current.delete(id);
    setToast(decision === "approved" ? "Request approved" : "Request rejected");
  }

  function handleError(id: string, errMsg: string) {
    restoreCard(id, errMsg);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <>
      {queue.length === 0 ? (
        <div className="rounded-xl border border-black/10 dark:border-white/15 px-5 py-10 text-center text-sm text-zinc-500">
          All caught up — no pending requests.
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 dark:border-white/15 divide-y divide-black/5 dark:divide-white/10">
          <h2 className="px-5 py-4 text-sm font-semibold flex items-center gap-2">
            Pending Requests
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold w-5 h-5">
              {queue.length}
            </span>
          </h2>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {queue.map((r) => {
              const expanded   = expandedIds.has(r.id);
              const longReason = (r.reason?.length ?? 0) > 100;
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{r.employee_name}</span>
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-zinc-500">{typeLabel[r.type]}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{formatDateRange(r.start_date, r.end_date)}</p>
                      {r.reason && (
                        <div>
                          <p className={`text-sm text-zinc-500 ${expanded ? "" : "line-clamp-2"}`}>
                            {r.reason}
                          </p>
                          {longReason && (
                            <button
                              onClick={() => toggleExpand(r.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                            >
                              {expanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-zinc-400">Submitted {relativeTime(r.created_at)}</p>
                    </div>
                  </div>
                  <DecisionPanel
                    request={r}
                    initialError={cardErrors[r.id] ?? null}
                    onConfirm={handleConfirm}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* outside both branches so toast fires even when queue empties */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
