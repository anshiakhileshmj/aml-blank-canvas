import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { supabase } from "@/integrations/supabase/client";
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
        <div className="h-64 relative rounded-lg overflow-hidden border border-border dark:border-border">
          <MapContainer
            center={[20, 0] as LatLngExpression}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {geoData?.map((location) => {
              if (!location.latitude || !location.longitude) return null;
              
              return (
                <CircleMarker
                  key={location.id}
                  center={[location.latitude, location.longitude] as LatLngExpression}
                  radius={getMarkerSize(location.total_transactions)}
                  pathOptions={{
                    fillColor: getMarkerColor(location.risk_score_avg),
                    color: "#fff",
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.7
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-sm">
                        {location.city ? `${location.city}, ` : ''}
                        {location.region ? `${location.region}, ` : ''}
                        {location.country}
                      </h3>
                      <div className="text-xs space-y-1">
                        <p>Risk Score: <span className="font-medium">{location.risk_score_avg.toFixed(1)}</span></p>
                        <p>Total Transactions: <span className="font-medium">{location.total_transactions}</span></p>
                        <p>Blocked: <span className="font-medium text-red-600">{location.blocked_transactions}</span></p>
                        <p>Allowed: <span className="font-medium text-green-600">{location.allowed_transactions}</span></p>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip>
                    <div className="text-xs">
                      <strong>{location.country}</strong><br/>
                      Risk: {location.risk_score_avg.toFixed(1)}<br/>
                      Transactions: {location.total_transactions}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          
          {/* Risk level indicators */}
          <div className="absolute top-4 right-4 bg-card/90 dark:bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border dark:border-border z-[1000]">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">High Risk (70+)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">Medium Risk (40-69)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                <span className="text-xs text-card-foreground dark:text-card-foreground">Low Risk (&lt;40)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
