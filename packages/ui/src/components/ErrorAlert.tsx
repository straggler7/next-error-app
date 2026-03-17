"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

interface ErrorAlertProps {
  type?: "error" | "success" | "info" | "warning";
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function ErrorAlert({
  type = "error",
  title,
  message,
  onClose,
  className = "",
}: ErrorAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alertRef.current) {
      alertRef.current.focus();
    }
  }, []);

  const styles = {
    error: {
      container: "border-red-200 bg-red-50 text-red-900",
      icon: <AlertTriangle size={20} className="text-red-600" />,
      title: "text-red-900",
      message: "text-red-800",
    },
    success: {
      container: "border-green-200 bg-green-50 text-green-900",
      icon: <CheckCircle size={20} className="text-green-600" />,
      title: "text-green-900",
      message: "text-green-800",
    },
    info: {
      container: "border-blue-200 bg-blue-50 text-blue-900",
      icon: <Info size={20} className="text-blue-600" />,
      title: "text-blue-900",
      message: "text-blue-800",
    },
    warning: {
      container: "border-yellow-200 bg-yellow-50 text-yellow-900",
      icon: <AlertTriangle size={20} className="text-yellow-600" />,
      title: "text-yellow-900",
      message: "text-yellow-800",
    },
  };

  const style = styles[type];

  return (
    <div
      ref={alertRef}
      className={`focus:outline-none ${className} rounded-lg border p-4 ${style.container}`}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="min-w-0 flex-1">
          {title && <h4 className={`mb-1 font-semibold ${style.title}`}>{title}</h4>}
          <p className={`text-sm leading-relaxed ${style.message}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close alert"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
