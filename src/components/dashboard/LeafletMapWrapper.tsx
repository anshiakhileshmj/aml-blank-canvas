import { useEffect, useState } from 'react';
import { LatLngExpression } from 'leaflet';

interface LeafletMapWrapperProps {
  geoData: any[];
  getMarkerColor: (score: number) => string;
  getMarkerSize: (count: number) => number;
}

export function LeafletMapWrapper({ geoData, getMarkerColor, getMarkerSize }: LeafletMapWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamic import to avoid SSR issues
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        // Fix Leaflet default icon issue
        const L = await import('leaflet');
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Dynamic import of react-leaflet components
        const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = await import('react-leaflet');
        setMapComponents({ MapContainer, TileLayer, CircleMarker, Popup, Tooltip });
      }
    };

    loadLeaflet();
  }, []);

  if (!isClient || !MapComponents) {
    return (
      <div className="h-64 bg-muted/20 dark:bg-muted/20 rounded-lg flex items-center justify-center border border-border dark:border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted dark:bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = MapComponents;

  return (
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
  );
}