import { STATUS_BADGE_STYLES } from "@/constants";

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.RECEIVED;
  return (
    <span
      className="badge"
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
