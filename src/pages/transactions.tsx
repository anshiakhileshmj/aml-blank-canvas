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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export">
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

      </div>
    </Layout>
  );
}