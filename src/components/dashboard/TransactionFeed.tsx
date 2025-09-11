import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, ArrowRightLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


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
  const { user } = useAuth();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
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
          <div className="space-y-3">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => {
                const riskScore = transaction.risk_score || 0;
                const RiskIcon = getRiskIcon(riskScore);
                const riskColor = getRiskColor(riskScore);
                const riskLabel = getRiskLabel(riskScore);
                const badgeVariant = getRiskBadgeVariant(riskScore);

                // Format addresses for display
                const formatAddress = (address: string) => {
                  if (!address) return 'N/A';
                  return `${address.slice(0, 6)}...${address.slice(-4)}`;
                };

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
                    case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
                    case 'flagged': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                    case 'pending': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
                  }
                };

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Transaction Icon */}
                      <div className="w-10 h-10 bg-primary/10 dark:bg-primary/10 rounded-lg flex items-center justify-center">
                        <ArrowRightLeft className="w-4 h-4 text-primary" />
                      </div>
                      
                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        {/* From → To */}
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-mono text-card-foreground">
                            {formatAddress(transaction.from_address)}
                          </span>
                          <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-mono text-card-foreground">
                            {formatAddress(transaction.to_address)}
                          </span>
                        </div>
                        
                        {/* Amount & Time */}
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span className="font-semibold">
                            {transaction.amount ? `${parseFloat(transaction.amount.toString()).toFixed(4)} ${transaction.currency || 'ETH'}` : 'N/A'}
                          </span>
                          <span>•</span>
                          <span>{new Date(transaction.created_at!).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Risk Score */}
                    <div className="flex items-center space-x-3">
                      {/* Status Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </div>
                      
                      {/* Risk Score */}
                      <div className="text-right">
                        <Badge variant={badgeVariant} className="text-xs">
                          {riskScore}
                        </Badge>
                        <div className={`text-xs mt-1 ${riskColor}`}>
                          <RiskIcon className="w-3 h-3 inline mr-1" />
                          {riskLabel}
                        </div>
                      </div>
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
