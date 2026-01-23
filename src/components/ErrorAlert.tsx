import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ErrorAlertProps {
  type?: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function ErrorAlert({ 
  type = 'error', 
  title, 
  message, 
  onClose, 
  className = '' 
}: ErrorAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  // Focus the alert when it appears for 508 compliance
  useEffect(() => {
    if (alertRef.current) {
      alertRef.current.focus();
    }
  }, []);

  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertTriangle size={20} className="text-red-600" />,
      title: 'text-red-900',
      message: 'text-red-800'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-900',
      icon: <CheckCircle size={20} className="text-green-600" />,
      title: 'text-green-900',
      message: 'text-green-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info size={20} className="text-blue-600" />,
      title: 'text-blue-900',
      message: 'text-blue-800'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      icon: <AlertTriangle size={20} className="text-yellow-600" />,
      title: 'text-yellow-900',
      message: 'text-yellow-800'
    }
  };

  const style = styles[type];

  return (
    <div 
      ref={alertRef}
      className={`border rounded-lg p-4 ${style.container} ${className} focus:outline-none`}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${style.title}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm leading-relaxed ${style.message}`}>
            {message}
          </p>
        </div>
        {onClose && (
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
  );
}
