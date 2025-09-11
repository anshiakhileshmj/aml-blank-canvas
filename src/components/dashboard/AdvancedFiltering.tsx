import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Flag, MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


function getRiskColor(riskScore: number) {
  if (riskScore >= 80) return "text-destructive dark:text-destructive";
  if (riskScore >= 60) return "text-chart-3 dark:text-chart-3";
  return "text-chart-2 dark:text-chart-2";
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "flagged":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

export function AdvancedFiltering() {
  const [dateRange, setDateRange] = useState("last-7-days");
  const [riskLevel, setRiskLevel] = useState("all-levels");
  const [country, setCountry] = useState("all-countries");
  const [transactionType, setTransactionType] = useState("all-types");

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
    description?: string | null;
    created_at: string | null;
    geo_data?: any;
    gas_price?: number | null;
  };

  const { user } = useAuth();
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["transactions", "filtered", { dateRange, riskLevel, country, transactionType }],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (riskLevel !== "all-levels") {
        const riskScore = transactions?.find(t => t.risk_score || 0)?.risk_score || 0;
        switch (riskLevel) {
          case "critical":
            query = query.gte('risk_score', 90);
            break;
          case "high":
            query = query.gte('risk_score', 70).lt('risk_score', 90);
            break;
          case "medium":
            query = query.gte('risk_score', 40).lt('risk_score', 70);
            break;
          case "low":
            query = query.lt('risk_score', 40);
            break;
        }
      }

      const { data, error } = await query;

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

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted dark:bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-10 bg-muted dark:bg-muted rounded"></div>
                </div>
              ))}
            </div>
            <div className="animate-pulse">
              <div className="h-64 bg-muted/20 dark:bg-muted/20 rounded-lg border border-border dark:border-border"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="date-range-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="custom-range">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Risk Level</label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger data-testid="risk-level-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">All levels</SelectItem>
                  <SelectItem value="critical">Critical (90+)</SelectItem>
                  <SelectItem value="high">High (70-89)</SelectItem>
                  <SelectItem value="medium">Medium (40-69)</SelectItem>
                  <SelectItem value="low">Low (0-39)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Blockchain</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger data-testid="blockchain-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-countries">All blockchains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Status</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Results Table */}
          <div className="border border-border dark:border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-muted/50">
                  <TableHead className="text-card-foreground dark:text-card-foreground">From</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">To</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Amount</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Blockchain</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Risk Score</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Status</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Location</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions && transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-muted/30 dark:hover:bg-muted/30 transition-colors"
                      data-testid={`filtered-transaction-${transaction.id}`}
                    >
                      <TableCell>
                        <span className="font-mono text-xs truncate max-w-[120px]" title={transaction.from_address}>
                          {transaction.from_address ? `${transaction.from_address.slice(0, 6)}...${transaction.from_address.slice(-4)}` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs truncate max-w-[120px]" title={transaction.to_address}>
                          {transaction.to_address ? `${transaction.to_address.slice(0, 6)}...${transaction.to_address.slice(-4)}` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {transaction.amount ? 
                              `${parseFloat(transaction.amount.toString()).toFixed(4)} ${transaction.currency || 'ETH'}` : 
                              'N/A'
                            }
                          </div>
                          {transaction.tx_hash && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {`${transaction.tx_hash.slice(0, 8)}...${transaction.tx_hash.slice(-6)}`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.blockchain || 'ethereum'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getRiskColor(transaction.risk_score || 0)}`}>
                            {transaction.risk_score || 0}
                          </span>
                          <div className="w-12 bg-border dark:bg-border rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (transaction.risk_score || 0) >= 80 ? "bg-destructive" :
                                (transaction.risk_score || 0) >= 60 ? "bg-chart-3" : "bg-chart-2"
                              }`}
                              style={{ width: `${transaction.risk_score || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {transaction.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {transaction.status === "blocked" && <XCircle className="w-4 h-4 text-red-500" />}
                          {transaction.status === "pending" && <Clock className="w-4 h-4 text-blue-500" />}
                          <Badge variant={getStatusVariant(transaction.status)} className="capitalize">
                            {transaction.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {transaction.geo_data?.country || 
                           transaction.geo_data?.country_name || 
                           'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground dark:text-muted-foreground text-xs">
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground dark:text-muted-foreground">No transactions match the current filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Showing {transactions?.length || 0} of {transactions?.length || 0} transactions
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled data-testid="pagination-previous">
                Previous
              </Button>
              <Button size="sm" data-testid="pagination-page-1">
                1
              </Button>
              <Button variant="outline" size="sm" data-testid="pagination-page-2">
                2
              </Button>
              <Button variant="outline" size="sm" data-testid="pagination-page-3">
                3
              </Button>
              <Button variant="outline" size="sm" data-testid="pagination-next">
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
