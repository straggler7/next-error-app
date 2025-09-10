import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

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
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertTriangle size={20} className="text-red-500" />,
      title: 'text-red-800',
      message: 'text-red-700'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle size={20} className="text-green-500" />,
      title: 'text-green-800',
      message: 'text-green-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info size={20} className="text-blue-500" />,
      title: 'text-blue-800',
      message: 'text-blue-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <AlertTriangle size={20} className="text-yellow-500" />,
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    }
  };

  const style = styles[type];

  return (
    <div className={`border rounded-lg p-4 ${style.container} ${className}`}>
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
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
