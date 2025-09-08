import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface GeographicRiskData {
  country: string;
  riskScore: number;
  latitude: number;
  longitude: number;
  transactionCount: number;
}

export function RiskHeatmap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { data: geoData, isLoading } = useQuery<GeographicRiskData[]>({
    queryKey: ["/api/analytics", "geographic-risk"],
    enabled: true,
  });

  useEffect(() => {
    // In a real implementation, you would initialize React Leaflet here
    // For now, we'll show a placeholder
    if (mapRef.current && !isLoading) {
      // Initialize map with React Leaflet
      console.log("Initialize React Leaflet map with geographic risk data", geoData);
    }
  }, [geoData, isLoading]);

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
        <div 
          ref={mapRef} 
          className="h-64 bg-muted/20 dark:bg-muted/20 rounded-lg border border-border dark:border-border relative overflow-hidden"
          data-testid="risk-heatmap"
        >
          {/* Placeholder for React Leaflet map */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">World Risk Heatmap</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">React Leaflet integration ready</p>
            </div>
          </div>
          
          {/* Risk level indicators */}
          <div className="absolute top-4 right-4 bg-card/90 dark:bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border dark:border-border">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive dark:bg-destructive rounded"></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">High Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-chart-3 dark:bg-chart-3 rounded"></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">Medium Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-chart-2 dark:bg-chart-2 rounded"></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
