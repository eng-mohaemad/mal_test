"use client";

import { useState, useTransition } from "react";
import { reviewLeaveRequest } from "@/app/actions/leave";
import { formatDateRange } from "@/lib/utils/dates";
import type { PendingRequest } from "./PendingQueue";

type Decision = "approved" | "rejected";

export default function DecisionPanel({
  request,
  initialError,
  onConfirm,
  onSuccess,
  onError,
}: {
  request: PendingRequest;
  // error from a previous attempt (survives optimistic remove + restore)
  initialError: string | null;
  onConfirm: (id: string) => void;                        // optimistic remove
  onSuccess: (id: string, decision: Decision) => void;    // server confirmed
  onError:   (id: string, errMsg: string) => void;        // restore + surface error
}) {
  const [decision, setDecision]      = useState<Decision | null>(null);
  const [comment,  setComment]       = useState("");
  // initialError pre-opens the panel on a restored card so the user sees why it failed
  const [errMsg,   setErrMsg]        = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  function open(d: Decision) {
    setDecision(d);
    setComment("");
    setErrMsg(null);
  }

  function cancel() {
    setDecision(null);
    setErrMsg(null);
  }

  function confirm() {
    if (!decision) return;
    const decided = decision;
    onConfirm(request.id); // optimistic remove — card unmounts after this
    startTransition(async () => {
      const { error } = await reviewLeaveRequest(request.id, decided, comment || null);
      if (error) {
        // parent restores the card; new instance receives error via initialError prop
        onError(request.id, error);
      } else {
        onSuccess(request.id, decided);
      }
    });
  }

  // Show the error banner even before the user re-opens the panel (card was just restored)
  if (!decision) {
    return (
      <div className="mt-3 space-y-2">
        {errMsg && <p className="text-xs text-red-600">{errMsg}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => open("approved")}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => open("rejected")}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-black/10 bg-zinc-50 p-4 space-y-3">
      <p className="text-sm font-medium">
        {decision === "approved" ? "Approve" : "Reject"} this request?
      </p>
      <p className="text-xs text-zinc-500">
        {request.employee_name} · {formatDateRange(request.start_date, request.end_date)} · {request.type}
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        maxLength={500}
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/20"
      />
      {errMsg && <p className="text-xs text-red-600">{errMsg}</p>}
      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 ${
            decision === "approved"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isPending ? "Saving…" : decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-black/10 hover:bg-zinc-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
