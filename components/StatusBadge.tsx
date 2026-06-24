type Status = "pending" | "approved" | "rejected";

const styles: Record<Status, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",
  rejected: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
