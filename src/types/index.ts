export interface User {
  name: string;
  role: string;
  avatar?: string;
}

export interface ErrorItem {
  id: string;
  code: string;
  description: string;
  status: 'active' | 'updated' | 'resolved';
  irm?: {
    title: string;
    content: string;
    steps?: string[];
  };
}

export interface SubmissionRecord {
  id: string;
  dln: string;
  serviceCenter: string;
  formType: string;
  returnType: 'Electronic' | 'Paper';
  taxPeriod: string;
  errors: string[];
  status: 'New' | 'Assigned' | 'QR Review' | 'Suspended';
  assignedTo: string;
  controlDay: string;
  updatedDate: string;
  taxpayerName?: string;
  ssnEin?: string;
  address?: string;
  taxYear?: number;
  filingStatus?: string;
  extensionType?: string;
  estimatedTaxLiability?: number;
  taxPaid?: number;
  balanceDue?: number;
  paymentMethod?: string;
  bankAccount?: string;
  routingNumber?: string;
  receivedDate?: string;
  processedDate?: string;
  confirmationNumber?: string;
  notes?: Note[];
}

export interface Note {
  id: string;
  timestamp: string;
  content: string;
  author: string;
}

export interface FilterState {
  searchAll: string;
  assignedTo: string;
  status: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface ActionDropdownItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export type StatusBadgeVariant = 'new' | 'assigned' | 'qr-review' | 'suspended';
export type PriorityLevel = 'high' | 'medium' | 'low';
