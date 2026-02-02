"use client";

import { MessageSquare } from "lucide-react";

interface AIFloatingButtonProps {
  onClick: () => void;
}

export default function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-40 group"
      aria-label="Open AI Assistant"
    >
      <MessageSquare className="w-6 h-6" />
      <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        AI Assistant
      </span>
    </button>
  );
}
