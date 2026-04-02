"use client";

interface SideNavItem {
  id: string;
  label: string;
  stepNumber: number;
  errorCount?: number;
}

interface SectionSideNavProps {
  items: SideNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  footerContent?: React.ReactNode;
}

export default function SectionSideNav({
  items,
  activeId,
  onChange,
  footerContent,
}: SectionSideNavProps) {
  return (
    <div className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Sections
      </div>

      <nav
        className="flex-1 overflow-y-auto py-1"
        role="navigation"
        aria-label="Form sections"
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          const hasErrors = (item.errorCount ?? 0) > 0;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? "true" : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-l-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#185FA5] ${
                isActive
                  ? "border-[#185FA5] bg-white text-gray-900 font-medium shadow-[inset_-1px_0_0_0_theme(colors.gray.200)]"
                  : "border-transparent text-gray-500 hover:bg-white hover:text-gray-700"
              }`}
            >
              {/* Step number */}
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                  isActive
                    ? "bg-blue-50 text-[#185FA5]"
                    : hasErrors
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {item.stepNumber}
              </span>

              {/* Label */}
              <span className="flex-1 min-w-0 truncate leading-snug">
                {item.label}
              </span>

              {/* Error badge */}
              {hasErrors && (
                <span
                  aria-label={`${item.errorCount} error${item.errorCount! > 1 ? "s" : ""}`}
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex-shrink-0"
                >
                  {item.errorCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {footerContent && (
        <div className="mt-auto px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          {footerContent}
        </div>
      )}
    </div>
  );
}
