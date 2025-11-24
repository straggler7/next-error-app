import { Info, X } from 'lucide-react';
import { forwardRef } from 'react';

interface InfoAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

const InfoAlert = forwardRef<HTMLDivElement, InfoAlertProps>(({ 
  message, 
  onClose, 
  className = '' 
}, ref) => {
  return (
    <div 
      ref={ref}
      tabIndex={-1}
      className={`border rounded-lg p-4 bg-blue-50 border-blue-200 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}>
      <div className="flex items-start gap-3">
        <Info size={20} className="text-blue-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-blue-700">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

InfoAlert.displayName = 'InfoAlert';

export default InfoAlert;
