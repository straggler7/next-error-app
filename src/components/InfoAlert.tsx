import { Info, X } from 'lucide-react';

interface InfoAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function InfoAlert({ 
  message, 
  onClose, 
  className = '' 
}: InfoAlertProps) {
  return (
    <div className={`border rounded-lg p-4 bg-blue-50 border-blue-200 text-blue-800 ${className}`}>
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
}
