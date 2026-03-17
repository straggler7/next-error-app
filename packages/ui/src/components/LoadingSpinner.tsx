interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 shadow-xl">
        <LoadingSpinner size="lg" />
        <p className="font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export function TableLoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="font-medium text-gray-600">Loading records...</p>
      </div>
    </div>
  );
}
