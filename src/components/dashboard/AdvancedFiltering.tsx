import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Flag, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";


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
    customerName: string;
    transactionType: string;
    amount: string;
    riskScore: number;
    status: string;
    createdAt?: string;
  };

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", "filtered", { dateRange, riskLevel, country, transactionType }],
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">Advanced Transaction Filtering</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Filter and search transactions by multiple criteria</p>
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
        <CardTitle className="text-card-foreground dark:text-card-foreground">Advanced Transaction Filtering</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Filter and search transactions by multiple criteria</p>
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
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger data-testid="country-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-countries">All countries</SelectItem>
                  <SelectItem value="united-states">United States</SelectItem>
                  <SelectItem value="united-kingdom">United Kingdom</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="high-risk">High-risk jurisdictions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">Transaction Type</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger data-testid="transaction-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All types</SelectItem>
                  <SelectItem value="wire-transfers">Wire transfers</SelectItem>
                  <SelectItem value="cash-deposits">Cash deposits</SelectItem>
                  <SelectItem value="international">International transfers</SelectItem>
                  <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Results Table */}
          <div className="border border-border dark:border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-muted/50">
                  <TableHead className="text-card-foreground dark:text-card-foreground">Transaction ID</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Customer</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Amount</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Risk Score</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Status</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Date</TableHead>
                  <TableHead className="text-card-foreground dark:text-card-foreground">Actions</TableHead>
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
                      <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground dark:text-card-foreground">{transaction.customerName}</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {transaction.transactionType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(transaction.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getRiskColor(transaction.riskScore)}`}>
                            {transaction.riskScore}
                          </span>
                          <div className="w-12 bg-border dark:bg-border rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                transaction.riskScore >= 80 ? "bg-destructive" :
                                transaction.riskScore >= 60 ? "bg-chart-3" : "bg-chart-2"
                              }`}
                              style={{ width: `${transaction.riskScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(transaction.status)} className="capitalize">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground dark:text-muted-foreground">
                        {new Date(transaction.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="p-1" data-testid={`view-transaction-${transaction.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1" data-testid={`flag-transaction-${transaction.id}`}>
                            <Flag className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1" data-testid={`more-actions-${transaction.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
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
