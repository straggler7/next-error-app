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
    <div className="w-[200px] flex-shrink-0 bg-[#f9f8f5] border-r border-black/10 flex flex-col py-4">
      <div className="text-[11px] font-medium text-[#888780] uppercase tracking-[0.06em] px-4 pb-3">
        Sections
      </div>

      <nav
        className="flex-1 overflow-y-auto"
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
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-left border-l-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#185FA5] ${
                isActive
                  ? "border-[#185FA5] bg-white text-[#1a1a18] font-medium"
                  : "border-transparent text-[#5f5e5a] hover:bg-white/60 hover:text-[#1a1a18]"
              }`}
            >
              {/* Step dot */}
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${
                  isActive
                    ? "bg-[#E6F1FB] text-[#185FA5]"
                    : hasErrors
                    ? "bg-red-100 text-red-600"
                    : "bg-[#f1efe8] text-[#888780]"
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
                  className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex-shrink-0"
                >
                  {item.errorCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {footerContent && (
        <div className="mt-auto pt-3 px-4 border-t border-black/10 text-[11px] text-[#888780]">
          {footerContent}
        </div>
      )}
    </div>
  );
}
