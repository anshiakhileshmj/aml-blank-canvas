// Note: This is for UI structure only - real data will come from Supabase
export const getMockTransactions = (): any[] => [
  {
    id: "tx_1",
    hash: "0x1234567890abcdef1234567890abcdef12345678",
    from: "0xabcd1234567890abcdef1234567890abcdef1234",
    to: "0xefgh5678901234567890abcdef1234567890abcd", 
    amount: "1.5 ETH",
    timestamp: new Date().toISOString(),
    status: "completed",
    riskScore: 85,
    riskLevel: "high"
  },
  {
    id: "tx_2",
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
    from: "0x1234567890abcdef1234567890abcdef12345678",
    to: "0x5678901234567890abcdef1234567890abcdef12",
    amount: "0.5 ETH", 
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "completed",
    riskScore: 25,
    riskLevel: "low"
  }
];

export const getMockAlerts = (): any[] => [
  {
    id: "alert_1",
    type: "high_risk_transaction",
    severity: "high",
    message: "High risk transaction detected",
    timestamp: new Date().toISOString(),
    status: "open",
    transactionHash: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "alert_2",
    type: "sanctions_match",
    severity: "critical", 
    message: "Sanctions list match found",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "investigating",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef12"
  }
];

export const getMockCases = (): any[] => [
  {
    id: "case_1",
    title: "High Risk Wallet Investigation", 
    status: "investigating",
    priority: "high",
    assignee: "John Doe",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    description: "Investigating wallet with multiple high-risk transactions"
  },
  {
    id: "case_2",
    title: "Sanctions Compliance Review",
    status: "open",
    priority: "critical",
    assignee: "Jane Smith", 
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    description: "Review wallet flagged for sanctions compliance"
  }
];

export const getMockApiKeys = (): any[] => [];

export const getMockReports = (): any[] => [
  {
    id: "report_1",
    title: "Monthly Risk Assessment",
    type: "risk_analysis",
    status: "completed", 
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    generatedBy: "System",
    downloadUrl: "/reports/monthly-risk-jan-2024.pdf"
  },
  {
    id: "report_2",
    title: "Sanctions Compliance Report",
    type: "compliance",
    status: "generating",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    generatedBy: "Admin",
    downloadUrl: null
  }
];

export const getMockRiskProfiles = (): any[] => [];

// Mock data structures for components that expect specific properties
export const getMockMetrics = (): MetricsData => ({
  highRiskCount: 23,
  activeCases: 8,
  sanctionsMatches: 3,
  apiCalls: 1547
});

export const getMockUsage = () => ({
  apiCalls: 15420,
  limit: 50000
});

export const getMockPlan = () => ({
  name: 'Professional',
  features: ['Unlimited API calls', 'Advanced analytics', 'Priority support']
});

export const getMockPaymentMethod = () => ({
  type: 'card',
  lastFour: '4242'
});

export const getMockInvoices = (): any[] => [
  {
    id: "inv_1",
    amount: 99.00,
    date: new Date(Date.now() - 2592000000).toISOString(),
    status: "paid"
  },
  {
    id: "inv_2",
    amount: 99.00, 
    date: new Date().toISOString(),
    status: "pending"
  }
];

export const getMockSanctionedWallets = (): any[] => [
  {
    id: "sw_1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    reason: "OFAC Sanctions List",
    addedAt: new Date(Date.now() - 7776000000).toISOString(),
    addedBy: "System",
    source: "OFAC"
  },
  {
    id: "sw_2",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    reason: "High Risk Activity",
    addedAt: new Date(Date.now() - 1728000000).toISOString(), 
    addedBy: "Admin",
    source: "Manual"
  }
];

export const getMockBillingData = () => [
  {
    id: "bill_1",
    amount: 99.00,
    date: new Date(Date.now() - 2592000000).toISOString(),
    status: "paid"
  },
  {
    id: "bill_2",
    amount: 99.00,
    date: new Date().toISOString(),
    status: "pending"
  }
];

// Analytics data structure
export interface AnalyticsData {
  date: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  total: number;
}

export interface MetricsData {
  highRiskCount: number;
  activeCases: number;
  sanctionsMatches: number;
  apiCalls: number;
}

export interface GeographicRiskData {
  country: string;
  riskScore: number;
  latitude: number;
  longitude: number;
  transactionCount: number;
}
