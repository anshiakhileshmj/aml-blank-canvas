import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  date: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  total: number;
}

export function RiskAnalytics() {
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/analytics", "risk-trends"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">Risk Trends (Last 30 Days)</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Suspicious transaction patterns over time</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20 dark:bg-muted/20 rounded-lg flex items-center justify-center border border-border dark:border-border animate-pulse">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted dark:bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-muted dark:bg-muted rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-muted dark:bg-muted rounded w-24 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultData: AnalyticsData[] = [
    { date: "Jan 1", highRisk: 12, mediumRisk: 45, lowRisk: 123, total: 180 },
    { date: "Jan 8", highRisk: 15, mediumRisk: 52, lowRisk: 134, total: 201 },
    { date: "Jan 15", highRisk: 8, mediumRisk: 38, lowRisk: 145, total: 191 },
    { date: "Jan 22", highRisk: 22, mediumRisk: 67, lowRisk: 156, total: 245 },
    { date: "Jan 29", highRisk: 18, mediumRisk: 48, lowRisk: 167, total: 233 },
  ];

  const chartData = analyticsData || defaultData;

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Risk Trends (Last 30 Days)</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Suspicious transaction patterns over time</p>
      </CardHeader>
      <CardContent>
        <div className="h-64" data-testid="risk-analytics-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMediumRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorLowRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))"
                }}
              />
              <Area
                type="monotone"
                dataKey="highRisk"
                stackId="1"
                stroke="hsl(var(--destructive))"
                fill="url(#colorHighRisk)"
                name="High Risk"
              />
              <Area
                type="monotone"
                dataKey="mediumRisk"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="url(#colorMediumRisk)"
                name="Medium Risk"
              />
              <Area
                type="monotone"
                dataKey="lowRisk"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorLowRisk)"
                name="Low Risk"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
