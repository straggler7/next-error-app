import { StatusBadgeVariant } from '../types';

interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const getVariantFromStatus = (status: string): StatusBadgeVariant => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'new';
      case 'assigned':
        return 'assigned';
      case 'qr review':
        return 'qr-review';
      case 'suspended':
        return 'suspended';
      default:
        return 'new';
    }
  };

  const actualVariant = variant || getVariantFromStatus(status);

  const variantStyles = {
    'new': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'assigned': 'bg-blue-100 text-blue-800 border-blue-200',
    'qr-review': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'suspended': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded text-xs font-medium border
      ${variantStyles[actualVariant]}
    `}>
      {status}
    </span>
  );
}
