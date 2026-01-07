import { Info, X, AlertTriangle } from 'lucide-react';
import { forwardRef } from 'react';

interface InfoAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
  variant?: 'info' | 'warning';
  showDismissButton?: boolean;
  dismissButtonText?: string;
}

const InfoAlert = forwardRef<HTMLDivElement, InfoAlertProps>(({ 
  message, 
  onClose, 
  className = '',
  variant = 'info',
  showDismissButton = false,
  dismissButtonText = 'Dismiss'
}, ref) => {
  const isWarning = variant === 'warning';
  
  const containerClasses = isWarning 
    ? `border rounded-lg p-4 bg-yellow-50 border-yellow-200 text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${className}`
    : `border rounded-lg p-4 bg-blue-50 border-blue-200 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`;

  const iconClasses = isWarning ? "text-yellow-500" : "text-blue-500";
  const textClasses = isWarning ? "text-yellow-700" : "text-blue-700";

  return (
    <div 
      ref={ref}
      tabIndex={-1}
      className={containerClasses}>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle size={20} className={iconClasses} />
        ) : (
          <Info size={20} className={iconClasses} />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${textClasses}`}>
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showDismissButton && onClose && (
            <button
              onClick={onClose}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isWarning 
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' 
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              }`}
            >
              {dismissButtonText}
            </button>
          )}
          {onClose && !showDismissButton && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close alert"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

InfoAlert.displayName = 'InfoAlert';

export default InfoAlert;
