export type Role = 'customer' | 'admin' | 'technician';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TicketStatus =
  | 'Open'
  | 'Under Review'
  | 'Assigned'
  | 'Technician Visit Scheduled'
  | 'In Progress'
  | 'Part Required'
  | 'On Hold'
  | 'Resolved'
  | 'Customer Confirmation Pending'
  | 'Closed'
  | 'Reopened';

export type IssueCategory =
  | 'Touch not working'
  | 'Display problem'
  | 'Panel not turning on'
  | 'Sound issue'
  | 'Connectivity issue'
  | 'Software issue'
  | 'Pen/Writing issue'
  | 'Screen damage'
  | 'Camera/Mic issue'
  | 'Installation issue'
  | 'Training required'
  | 'Warranty claim'
  | 'Other';

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Touch not working',
  'Display problem',
  'Panel not turning on',
  'Sound issue',
  'Connectivity issue',
  'Software issue',
  'Pen/Writing issue',
  'Screen damage',
  'Camera/Mic issue',
  'Installation issue',
  'Training required',
  'Warranty claim',
  'Other',
];

export interface Panel {
  serialNumber: string;
  size: string;
  installationDate: string;
}

export interface User {
  id: string;
  customerId: string;
  name: string;
  email: string;
  mobileNumber?: string;
  role: Role;
  googleId?: string;
  profileComplete?: boolean;
  organizationName?: string;
  address?: string;
  city?: string;
  state?: string;
  panels?: Panel[];
  isActive: boolean;
  createdAt: string;
}

export interface StatusHistory {
  status: TicketStatus;
  changedBy: { name: string; role: Role } | string;
  timestamp: string;
  remarks?: string;
}

export interface Resolution {
  workPerformed: string;
  partsUsed: string[];
  images: string[];
  customerSignature?: string;
  remarks?: string;
  resolvedAt: string;
}

export interface Feedback {
  rating: number;
  comment?: string;
  submittedAt: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  customerId: User | string;
  panelSerialNumber: string;
  issueCategory: IssueCategory;
  description: string;
  priority: Priority;
  attachments: string[];
  status: TicketStatus;
  statusHistory: StatusHistory[];
  assignedTeam?: string;
  assignedTechnician?: User | string;
  scheduledVisitDate?: string;
  expectedResponseTime?: string;
  expectedResolutionTime?: string;
  resolutionDeadline?: string;
  assignedAt?: string;
  resolution?: Resolution;
  closedAt?: string;
  feedback?: Feedback;
  reopenStatus: {
    isReopened: boolean;
    reopenCount: number;
    reasons: { reason: string; reopenedAt: string }[];
  };
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  tickets?: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface KPIs {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  slaCompliant: number;
  avgRating: string | number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface Notification {
  id: string;
  message: string;
  ticketId?: string;
  read: boolean;
  createdAt: string;
}
