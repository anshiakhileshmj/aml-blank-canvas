// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";


function getRiskIcon(riskScore: number) {
  if (riskScore >= 80) return AlertTriangle;
  if (riskScore >= 60) return AlertCircle;
  return CheckCircle;
}

function getRiskColor(riskScore: number) {
  if (riskScore >= 80) return "text-destructive dark:text-destructive";
  if (riskScore >= 60) return "text-chart-3 dark:text-chart-3";
  return "text-chart-2 dark:text-chart-2";
}

function getRiskBadgeVariant(riskScore: number): "destructive" | "secondary" | "default" {
  if (riskScore >= 80) return "destructive";
  if (riskScore >= 60) return "secondary";
  return "default";
}

function getRiskLabel(riskScore: number) {
  if (riskScore >= 80) return "High Risk";
  if (riskScore >= 60) return "Medium Risk";
  return "Low Risk";
}

export function TransactionFeed() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", "recent"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground dark:text-card-foreground">Real-time Transaction Monitoring</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-chart-2 dark:bg-chart-2 rounded-full animate-pulse-slow"></div>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted dark:bg-muted rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted dark:bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground dark:text-card-foreground">Real-time Transaction Monitoring</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-chart-2 dark:bg-chart-2 rounded-full animate-pulse-slow"></div>
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => {
                const RiskIcon = getRiskIcon(transaction.riskScore);
                const riskColor = getRiskColor(transaction.riskScore);
                const riskLabel = getRiskLabel(transaction.riskScore);
                const badgeVariant = getRiskBadgeVariant(transaction.riskScore);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-destructive/10 dark:bg-destructive/10 rounded-lg flex items-center justify-center">
                        <RiskIcon className={`text-sm w-4 h-4 ${riskColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">{transaction.id}</p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          ${parseFloat(transaction.amount).toLocaleString()} • {transaction.customerName} → {transaction.description || 'Transaction'}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {new Date(transaction.createdAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={badgeVariant}>
                        {riskLabel}
                      </Badge>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        Score: {transaction.riskScore}/100
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground dark:text-muted-foreground">No recent transactions</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
