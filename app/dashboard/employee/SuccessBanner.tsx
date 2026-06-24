"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SuccessBanner() {
  const router = useRouter();

  // Clear the query param after 4 seconds so a refresh won't re-show it
  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard/employee"), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      role="status"
      className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
    >
      ✓ Leave request submitted successfully.
    </div>
  );
}
