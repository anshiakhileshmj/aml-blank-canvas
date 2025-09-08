import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, FolderOpen, ShieldQuestion, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  iconBgColor: string;
}

function MetricCard({ title, value, change, changeType, icon, iconBgColor }: MetricCardProps) {
  const TrendIcon = changeType === "positive" ? TrendingUp : TrendingDown;
  const trendColor = changeType === "positive" ? "text-chart-2 dark:text-chart-2" : "text-destructive dark:text-destructive";

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardContent className="p-6">
         <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2 leading-tight">{title}</p>
            <p className="text-2xl font-bold text-card-foreground dark:text-card-foreground mb-2" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className={`text-xs ${trendColor} flex items-center`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {change}
            </p>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center ml-4 flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Get current user from Supabase session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Get user's API keys to filter data
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('partner_id')
        .eq('user_id', user.id);

      if (apiKeysError) throw apiKeysError;
      const partnerIds = apiKeys.map(key => key.partner_id);

      // Calculate date ranges
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Parallel queries for better performance
      const [transactionsResult, alertsResult, sanctionsResult, apiCallsResult] = await Promise.all([
        // High risk transactions (risk_score >= 70)
        supabase
          .from('transactions')
          .select('risk_score, created_at')
          .eq('user_id', user.id)
          .gte('risk_score', 70)
          .gte('created_at', oneWeekAgo.toISOString()),
        
        // Active alerts/cases
        supabase
          .from('alerts')
          .select('status, created_at')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        
        // Sanctions matches
        supabase
          .from('sanctions_matches')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString()),
        
        // API calls from relay logs (today)
        partnerIds.length > 0 ? supabase
          .from('relay_logs')
          .select('created_at')
          .in('partner_id', partnerIds)
          .gte('created_at', oneDayAgo.toISOString()) : Promise.resolve({ data: [], error: null })
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (alertsResult.error) throw alertsResult.error;
      if (sanctionsResult.error) throw sanctionsResult.error;
      if (apiCallsResult.error) throw apiCallsResult.error;

      // Calculate this week vs last week comparisons
      const thisWeekTransactions = transactionsResult.data.filter(t => 
        new Date(t.created_at) >= oneWeekAgo
      );
      const lastWeekTransactions = transactionsResult.data.filter(t => {
        const date = new Date(t.created_at);
        return date >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < oneWeekAgo;
      });

      const highRiskCount = thisWeekTransactions.length;
      const highRiskChange = lastWeekTransactions.length > 0 
        ? Math.round(((highRiskCount - lastWeekTransactions.length) / lastWeekTransactions.length) * 100)
        : 0;

      const activeCases = alertsResult.data.length;
      const sanctionsMatches = sanctionsResult.data.length;
      const apiCalls = apiCallsResult.data.length;

      return {
        highRiskCount,
        highRiskChange,
        activeCases,
        sanctionsMatches,
        apiCalls,
      };
    },
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card dark:bg-card border-border dark:border-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted dark:bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted dark:bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default values if no data
  const defaultMetrics = {
    highRiskCount: 0,
    highRiskChange: 0,
    activeCases: 0,
    sanctionsMatches: 0,
    apiCalls: 0,
  };

  const metricsData = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="High Risk Transactions"
        value={metricsData.highRiskCount}
        change={`${metricsData.highRiskChange >= 0 ? '+' : ''}${metricsData.highRiskChange}% from last week`}
        changeType={metricsData.highRiskChange <= 0 ? "positive" : "negative"}
        icon={<AlertTriangle className="text-destructive dark:text-destructive w-6 h-6" />}
        iconBgColor="bg-destructive/10 dark:bg-destructive/10"
      />
      
      <MetricCard
        title="Active Cases"
        value={metricsData.activeCases}
        change={`${metricsData.activeCases} alerts require attention`}
        changeType="positive"
        icon={<FolderOpen className="text-chart-2 dark:text-chart-2 w-6 h-6" />}
        iconBgColor="bg-chart-2/10 dark:bg-chart-2/10"
      />
      
      <MetricCard
        title="Sanctions Matches"
        value={metricsData.sanctionsMatches}
        change={`${metricsData.sanctionsMatches} matches this week`}
        changeType={metricsData.sanctionsMatches > 0 ? "negative" : "positive"}
        icon={<ShieldQuestion className="text-chart-3 dark:text-chart-3 w-6 h-6" />}
        iconBgColor="bg-chart-3/10 dark:bg-chart-3/10"
      />
      
      <MetricCard
        title="API Calls Today"
        value={metricsData.apiCalls.toLocaleString()}
        change={`${metricsData.apiCalls} requests processed`}
        changeType="positive"
        icon={<BarChart3 className="text-chart-1 dark:text-chart-1 w-6 h-6" />}
        iconBgColor="bg-chart-1/10 dark:bg-chart-1/10"
      />
    </div>
  );
}
