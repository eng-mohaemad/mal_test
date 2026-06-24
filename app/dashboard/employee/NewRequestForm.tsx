"use client";

import { useActionState, useState } from "react";
import { submitLeaveRequest, type LeaveRequestState } from "@/app/actions/leave";
import { todayInOffset } from "@/lib/utils/dates";

const initialState: LeaveRequestState = { error: null };

export default function NewRequestForm() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [tzOffset] = useState(() => new Date().getTimezoneOffset());
  const today = todayInOffset(tzOffset);
  const [state, formAction, pending] = useActionState(submitLeaveRequest, initialState);

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/15">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold">New Leave Request</h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {open ? "Cancel" : "+ New Request"}
        </button>
      </div>

      {open && (
        <form
          action={formAction}
          className="border-t border-black/10 px-5 py-4 space-y-4 dark:border-white/15"
        >
          <input type="hidden" name="tz_offset" value={tzOffset} />
          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">
              Leave type
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900 dark:focus:border-white/50"
            >
              <option value="">Select type…</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="start_date" className="text-sm font-medium">
                Start date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900 dark:focus:border-white/50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="end_date" className="text-sm font-medium">
                End date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                required
                min={startDate || today}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900 dark:focus:border-white/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <ReasonTextarea />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pending ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      )}
    </div>
  );
}

function ReasonTextarea() {
  const [len, setLen] = useState(0);
  return (
    <div className="relative">
      <textarea
        id="reason"
        name="reason"
        maxLength={500}
        rows={3}
        onChange={(e) => setLen(e.target.value.length)}
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900 dark:focus:border-white/50 resize-none"
      />
      <span className="absolute bottom-2 right-2 text-xs text-zinc-400">
        {len}/500
      </span>
    </div>
  );
}
