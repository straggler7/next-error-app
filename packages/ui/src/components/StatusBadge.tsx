import type { StatusBadgeVariant } from "../types";

interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const getVariantFromStatus = (value: string): StatusBadgeVariant => {
    switch (value.toLowerCase()) {
      case "new":
        return "new";
      case "assigned":
        return "assigned";
      case "qr review":
        return "qr-review";
      case "suspended":
        return "suspended";
      default:
        return "new";
    }
  };

  const actualVariant = variant ?? getVariantFromStatus(status);

  const variantStyles: Record<StatusBadgeVariant, string> = {
    new: "border-yellow-200 bg-yellow-100 text-yellow-800",
    assigned: "border-blue-200 bg-blue-100 text-blue-800",
    "qr-review": "border-cyan-200 bg-cyan-100 text-cyan-800",
    suspended: "border-red-200 bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-medium ${variantStyles[actualVariant]}`}>
      {status}
    </span>
  );
}
