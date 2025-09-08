import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function RealTimeMetrics() {
  const { user } = useAuth();

  // Fetch real-time metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get user's API keys to filter transactions
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('partner_id')
        .eq('user_id', user.id);

      if (apiKeysError) throw apiKeysError;

      const partnerIds = apiKeys.map(key => key.partner_id);

      if (partnerIds.length === 0) {
        return {
          totalTransactions: 0,
          allowedTransactions: 0,
          blockedTransactions: 0,
          highRiskTransactions: 0,
          averageRiskScore: 0,
          sanctionsMatches: 0,
        };
      }

      // Get transactions from relay_logs for the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: transactions, error: transError } = await supabase
        .from('relay_logs')
        .select('decision, risk_score, risk_band, reasons')
        .in('partner_id', partnerIds)
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (transError) throw transError;

      // Calculate metrics
      const totalTransactions = transactions.length;
      const allowedTransactions = transactions.filter(t => t.decision === 'allowed').length;
      const blockedTransactions = transactions.filter(t => t.decision === 'blocked').length;
      const highRiskTransactions = transactions.filter(t => t.risk_score >= 70).length;
      const averageRiskScore = transactions.length > 0 
        ? Math.round(transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / transactions.length)
        : 0;
      
      // Check for sanctions matches
      const sanctionsMatches = transactions.filter(t => 
        t.reasons && Array.isArray(t.reasons) && 
        t.reasons.some((reason: string) => reason.toLowerCase().includes('sanction'))
      ).length;

      return {
        totalTransactions,
        allowedTransactions,
        blockedTransactions,
        highRiskTransactions,
        averageRiskScore,
        sanctionsMatches,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = metrics || {
    totalTransactions: 0,
    allowedTransactions: 0,
    blockedTransactions: 0,
    highRiskTransactions: 0,
    averageRiskScore: 0,
    sanctionsMatches: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions (24h)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricsData.totalTransactions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metricsData.allowedTransactions} allowed, {metricsData.blockedTransactions} blocked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Risk Transactions</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricsData.highRiskTransactions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Risk score ≥ 70
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricsData.averageRiskScore}</div>
          <div className="flex items-center space-x-1">
            <Badge 
              variant={
                metricsData.averageRiskScore >= 70 ? 'destructive' :
                metricsData.averageRiskScore >= 50 ? 'secondary' : 'default'
              }
              className="text-xs"
            >
              {metricsData.averageRiskScore >= 70 ? 'HIGH' :
               metricsData.averageRiskScore >= 50 ? 'MEDIUM' : 'LOW'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sanctions Matches</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{metricsData.sanctionsMatches}</div>
          <p className="text-xs text-muted-foreground">
            {metricsData.sanctionsMatches > 0 ? 'Immediate attention required' : 'All clear'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}