export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
  expense_count?: number;
  total_spent?: number;
}

export interface Category {
  id: string;
  name: string;
  is_default: number;
  threshold?: number;
  last_month_spent?: number;
  default_threshold_percent?: number;
  suggested_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  expense_type: string;
  expense_month: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface Income {
  id: string;
  amount: number;
  income_month: string;
  source: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlySummary {
  id?: string;
  month: string;
  income: number;
  total_expense: number;
  total_savings: number;
}

export interface AnalysisFlag {
  issue: string;
  severity: string;
  explanation: string;
  category?: string;
  value?: number;
}

export interface Recommendation {
  title: string;
  issue: string;
  severity: string;
  action: string;
  impact: string;
}

export interface AnalysisResult {
  month: string;
  cluster_label: string;
  predicted_savings: number;
  financial_score: number;
  overspending_flags: AnalysisFlag[];
  recommendations: Recommendation[];
}

export interface DashboardSummary {
  income: number;
  total_expense: number;
  total_savings: number;
  savings_rate: number;
  financial_score: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  segment: { label: string };
  prediction: { predicted_savings: number };
  alerts: AnalysisFlag[];
  recommendations: Recommendation[];
  charts: {
    category_breakdown: { category: string; amount: number }[];
    history: MonthlySummary[];
  };
  recent_expenses: Expense[];
}

export interface AdminOverview {
  total_users: number;
  total_expenses: number;
  total_expense_amount: number;
  total_reports?: number;
  latest_activity?: {
    expense_month: string;
    count: number;
    total: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data?: {
    expenses: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
