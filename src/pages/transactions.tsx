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
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.to_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    const matchesRisk = riskFilter === "all" || 
      (riskFilter === "high" && transaction.risk_score >= 70) ||
      (riskFilter === "medium" && transaction.risk_score >= 40 && transaction.risk_score < 70) ||
      (riskFilter === "low" && transaction.risk_score < 40);
    
    return matchesSearch && matchesStatus && matchesRisk;
  }) || [];

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const flaggedCount = filteredTransactions.filter(tx => tx.status === "flagged").length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">Monitor and analyze transaction flows</p>
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
                {filteredTransactions.filter(tx => tx.riskScore >= 70).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search customers, IDs, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Risk Level</label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger data-testid="select-risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="high">High Risk (70+)</SelectItem>
                    <SelectItem value="medium">Medium Risk (40-69)</SelectItem>
                    <SelectItem value="low">Low Risk (&lt;40)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent transaction activity and risk assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Blockchain</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-xs">{transaction.to_address}</div>
                          <div className="text-xs text-muted-foreground">
                            From: {transaction.from_address}
                          </div>
                          {transaction.customer_name && (
                            <div className="text-xs text-muted-foreground">
                              Customer: {transaction.customer_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.amount ? `${parseFloat(transaction.amount).toLocaleString()} ${transaction.currency || 'ETH'}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.blockchain || 'ethereum'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge variant={getRiskScore(transaction.risk_score || 0)}>
                            {transaction.risk_score || 0}/100
                          </Badge>
                          {transaction.risk_level && (
                            <Badge variant={getRiskBadgeColor(transaction.risk_level)} className="text-xs">
                              {transaction.risk_level}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <span className="capitalize">{transaction.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${transaction.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}