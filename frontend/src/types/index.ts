export type UserRole = 'EMPLOYEE' | 'EMPLOYER' | 'ADMIN';
export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ExpenseCategory =
  | 'TRAVEL' | 'MEALS' | 'ACCOMMODATION' | 'OFFICE_SUPPLIES'
  | 'SOFTWARE' | 'TRAINING' | 'MEDICAL' | 'COMMUNICATION' | 'ENTERTAINMENT' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  currency: string;
  departmentId?: string;
  department?: { id: string; name: string };
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate: string;
  month: number;
  year: number;
  status: ExpenseStatus;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ReimbursementItem {
  id: string;
  expenseId: string;
  expense: Pick<Expense, 'id' | 'title' | 'category' | 'expenseDate' | 'amount' | 'currency'>;
  originalAmount: number;
  originalCurrency: string;
  amountUSD: number;
  exchangeRateToUSD: number;
}

export interface ReimbursementRequest {
  id: string;
  employeeId: string;
  employee: Pick<User, 'id' | 'name' | 'email'>;
  approverId?: string;
  approver?: Pick<User, 'id' | 'name'>;
  status: ReimbursementStatus;
  totalAmountUSD: number;
  approverCurrency: string;
  totalInApproverCurrency: number;
  totalInViewerCurrency?: number;
  viewerCurrency?: string;
  notes?: string;
  rejectionReason?: string;
  month: number;
  year: number;
  items: ReimbursementItem[];
  submittedAt: string;
  processedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  monthlyBudget: number;
  currency: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Pagination;
}
