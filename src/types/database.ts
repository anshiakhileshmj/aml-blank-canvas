export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  country?: string;
  subscription_plan: 'free' | 'starter' | 'pro' | 'growth';
  subscription_status: string;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  api_calls_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  partner_id: string;
  name: string;
  key: string;
  key_hash: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  api_key_id?: string;
  to_address: string;
  from_address?: string;
  amount: string;
  currency: string;
  blockchain: string;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  is_sanctioned: boolean;
  customer_name?: string;
  customer_id?: string;
  description?: string;
  processed_at: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  transaction_id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  is_resolved: boolean;
  assigned_to?: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  case_number: string;
  title: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by?: string;
  related_transactions: string[];
  related_alerts: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  report_type: string;
  description?: string;
  status: string;
  generated_by?: string;
  file_url?: string;
  parameters: Record<string, any>;
  data: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  api_calls_used: number;
  api_calls_limit: number;
  transactions_processed: number;
  storage_used_gb: number;
  overage_charges: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  razorpay_invoice_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  billing_period_start?: string;
  billing_period_end?: string;
  description?: string;
  metadata: Record<string, any>;
  paid_at?: string;
  created_at: string;
}

export interface AnalyticsData {
  id: string;
  user_id: string;
  metric_type: string;
  date_bucket: string;
  data: Record<string, any>;
  created_at: string;
}

export interface RelayLog {
  id: string;
  partner_id: string;
  chain: string;
  from_addr?: string;
  to_addr: string;
  decision: string;
  risk_band: string;
  risk_score: number;
  reasons: string[];
  idempotency_key?: string;
  created_at: string;
}

export interface DeveloperProfile {
  partner_id: string;
  company_name: string | null;
  website: string | null;
  api_usage_plan: string;
  monthly_request_limit: number;
}