"use client";

interface Tab {
  id: string;
  label: string;
  errorCount?: number;
}

interface SectionTabNavProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SectionTabNav({
  tabs,
  activeId,
  onChange,
}: SectionTabNavProps) {
  return (
    <div
      className="flex overflow-x-auto border-b border-gray-200 bg-white"
      role="tablist"
      aria-label="Form sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeId}
          aria-controls={`section-panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium
            border-b-2 transition-colors duration-150 whitespace-nowrap focus:outline-none
            focus:ring-2 focus:ring-inset focus:ring-[#00599c]
            ${
              tab.id === activeId
                ? "border-[#00599c] text-[#00599c] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }
          `}
        >
          {tab.label}
          {tab.errorCount != null && tab.errorCount > 0 && (
            <span
              aria-label={`${tab.errorCount} error${tab.errorCount > 1 ? "s" : ""}`}
              className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full"
            >
              {tab.errorCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
