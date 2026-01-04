export interface UserProfile {
  userId: string;
  seid: string;
  userName: string;
  designation: string;
  serviceCenterId: string;
  teamCode: string;
  activeStatus: boolean;
  profile: {
    profiles: Record<string, {
      dlnSearch: boolean;
      deleteEnabled: boolean;
      qualityReviewEnabled: boolean;
      leadRoleEnabled: boolean;
      rejectsEnabled: boolean;
      suspendStatusCodes: string[];
    }>;
  };
}

export interface User {
  name?: string;
  role  ?: string;
  group?: 'tax_examiners' | 'managers' | 'analysts';
  avatar?: string;
  seid: string;
  profile?: UserProfile | null;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  seid: string | null;
  isDevelopmentMode?: boolean;
  refreshAuth?: () => Promise<void>;
}

export interface AuthenticationError {
  type: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_SEID';
  message: string;
}

export interface ErrorItem {
  id: string;
  code: string;
  type: string;
  description: string;
  status: 'active' | 'updated' | 'resolved';
  errorFields?: string[];
  errorConfigKey?: string; // Key from errorConfig4868 for field errors
  isFieldError?: boolean; // Flag to identify field errors
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
  disabled?: boolean;
}

export type InvetoryItem = {
  inventoryId: number;
  workRecord: {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface InventoryRecord {
  inventoryId: number;
  processId: number;
  createdTime: string;
  taxPeriod: string;
  statusEventId: number;
  status: string;
  updatedDate: string;
  payloadId: number;
  seid: string;
  submissionTins: string;
  submissionErrorCodes: string | null;
  submissionNames: string;
  ageFromDate: string | null;
  daysAged: number;
  suspendedExpirationDate: string | null;
  suspendedStatusCode: string | null;
  clearCodes: string | null;
  dln: string;
  formType: string;
  controlDay: string;
  serviceCenterId: number;
  // Computed fields for display
  serviceCenter?: string;
  returnType?: string;
  errors?: string[];
  assignedTo?: string;
  qrStatus?: 'pending' | 'approved' | 'rejected' | 'rework';
}

export type StatusBadgeVariant = 'new' | 'assigned' | 'qr-review' | 'suspended';
export type PriorityLevel = 'high' | 'medium' | 'low';
