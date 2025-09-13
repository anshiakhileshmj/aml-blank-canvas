import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeafletMapWrapper } from "./LeafletMapWrapper";
import 'leaflet/dist/leaflet.css';

interface GeographicRiskData {
  id: string;
  country: string;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  risk_score_avg: number;
  total_transactions: number;
  blocked_transactions: number;
  allowed_transactions: number;
}

export function RiskHeatmap() {
  const { data: geoData, isLoading } = useQuery<GeographicRiskData[]>({
    queryKey: ["geographic-risk-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geographic_risk_data')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getMarkerColor = (riskScore: number) => {
    if (riskScore >= 70) return '#ef4444'; // High risk - red
    if (riskScore >= 40) return '#f97316'; // Medium risk - orange  
    return '#22c55e'; // Low risk - green
  };

  const getMarkerSize = (totalTransactions: number) => {
    if (totalTransactions > 100) return 12;
    if (totalTransactions > 20) return 8;
    return 5;
  };

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">Geographic Risk Heatmap</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">High-risk regions and transaction volumes</p>
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

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Geographic Risk Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">High-risk regions and transaction volumes</p>
      </CardHeader>
      <CardContent>
        <LeafletMapWrapper
          geoData={geoData || []}
          getMarkerColor={getMarkerColor}
          getMarkerSize={getMarkerSize}
        />
      </CardContent>
    </Card>
  );
}
