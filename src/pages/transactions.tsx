import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Filter, Download, Eye, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout } from "@/components/layout/Layout";
import { AdvancedFiltering } from "@/components/dashboard/AdvancedFiltering";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const getRiskBadgeColor = (level: string) => {
  switch (level) {
    case "critical": return "destructive";
    case "high": return "secondary";
    case "medium": return "outline";
    default: return "default";
  }
};

const getRiskScore = (score: number) => {
  if (score >= 80) return "destructive";
  if (score >= 60) return "secondary";
  if (score >= 40) return "outline";
  return "default";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
    case "flagged": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "pending": return <Clock className="w-4 h-4 text-blue-500" />;
    default: return <Clock className="w-4 h-4 text-blue-500" />;
  }
};

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  type Transaction = {
    id: string;
    user_id: string;
    tx_hash?: string | null;
    from_address: string;
    to_address: string;
    amount?: number | null;
    currency?: string | null;
    blockchain?: string | null;
    status: string;
    risk_score?: number | null;
    risk_level?: string | null;
    customer_name?: string | null;
    customer_id?: string | null;
    description?: string | null;
    created_at: string | null;
    updated_at: string | null;
    geo_data?: any;
    gas_price?: number | null;
    gas_limit?: number | null;
    transaction_size?: number | null;
    is_contract_interaction?: boolean | null;
  };

  const { user } = useAuth();
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["transactions", { search: searchQuery, status: statusFilter, risk: riskFilter }],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filteredTransactions = transactions?.filter((transaction: Transaction) => {
    const matchesSearch = !searchQuery || 
      transaction.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.to_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    const riskScore = transaction.risk_score || 0;
    const matchesRisk = riskFilter === "all" || 
      (riskFilter === "high" && riskScore >= 70) ||
      (riskFilter === "medium" && riskScore >= 40 && riskScore < 70) ||
      (riskFilter === "low" && riskScore < 40);
    
    return matchesSearch && matchesStatus && matchesRisk;
  }) || [];

  const totalAmount = filteredTransactions.reduce((sum: number, tx: Transaction) => sum + (tx.amount || 0), 0);
  const flaggedCount = filteredTransactions.filter((tx: Transaction) => tx.status === "flagged").length;

  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;
    
    const headers = [
      'From Address',
      'To Address', 
      'Amount',
      'Currency',
      'Blockchain',
      'Risk Score',
      'Status',
      'Location',
      'Date',
      'TX Hash',
      'Gas Price',
      'Gas Limit',
      'Transaction Size',
      'Contract Interaction',
      'Customer Name',
      'Customer ID'
    ];
    
        const csvData = filteredTransactions.map(tx => [
      tx.from_address || '',
      tx.to_address || '',
      tx.amount || 0,
      tx.currency || 'ETH',
      tx.blockchain || 'ethereum',
      tx.risk_score || 0,
      tx.status || '',
      typeof tx.geo_data === 'object' && tx.geo_data && 'country' in tx.geo_data 
        ? (tx.geo_data as any).country
        : typeof tx.geo_data === 'object' && tx.geo_data && 'country_name' in tx.geo_data
        ? (tx.geo_data as any).country_name
        : 'Unknown',
      tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '',
      tx.tx_hash || '',
      tx.gas_price || '',
      tx.gas_limit || '',
      tx.transaction_size || '',
      tx.is_contract_interaction ? 'Yes' : 'No',
      tx.customer_name || '',
      tx.customer_id || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-transactions">
                {filteredTransactions.length.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-amount">
                ${totalAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-flagged">
                {flaggedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-high-risk">
                {filteredTransactions.filter((tx: Transaction) => (tx.risk_score || 0) >= 70).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filtering */}
        <AdvancedFiltering />

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Complete transaction history with security analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading transactions...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-600">Error loading transactions</div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">No transactions found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Gas Price</TableHead>
                      <TableHead>Gas Limit</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: Transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(transaction.status)}
                            <Badge variant={transaction.status === "flagged" ? "destructive" : "default"}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {transaction.from_address?.slice(0, 10)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {transaction.to_address?.slice(0, 10)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {transaction.amount ? `${transaction.amount} ${transaction.currency || 'ETH'}` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRiskScore(transaction.risk_score || 0)}>
                            {transaction.risk_score || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.gas_price ? `${transaction.gas_price} gwei` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.gas_limit || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.transaction_size ? `${transaction.transaction_size} bytes` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.is_contract_interaction ? "secondary" : "outline"}>
                            {transaction.is_contract_interaction ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.customer_name || transaction.customer_id || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {typeof transaction.geo_data === 'object' && transaction.geo_data && 'country' in transaction.geo_data 
                              ? (transaction.geo_data as any).country
                              : typeof transaction.geo_data === 'object' && transaction.geo_data && 'country_name' in transaction.geo_data
                              ? (transaction.geo_data as any).country_name
                              : 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}