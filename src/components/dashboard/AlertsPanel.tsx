// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldQuestion, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";


function getAlertIcon(alertType: string) {
  switch (alertType) {
    case "sanctions":
      return AlertTriangle;
    case "pep":
      return ShieldQuestion;
    case "unusual_pattern":
      return TrendingUp;
    default:
      return AlertTriangle;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "secondary";
    case "medium":
      return "outline";
    default:
      return "outline";
  }
}

function getSeverityBgColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-destructive/5 dark:bg-destructive/5 border-destructive/20 dark:border-destructive/20";
    case "high":
      return "bg-chart-3/5 dark:bg-chart-3/5 border-chart-3/20 dark:border-chart-3/20";
    case "medium":
      return "bg-chart-1/5 dark:bg-chart-1/5 border-chart-1/20 dark:border-chart-1/20";
    default:
      return "bg-muted/30 dark:bg-muted/30 border-border dark:border-border";
  }
}

export function AlertsPanel() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/alerts", "critical"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">Critical Alerts</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Flagged transactions requiring attention</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-muted/30 dark:bg-muted/30 border border-border dark:border-border rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-muted dark:bg-muted rounded mt-1"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted dark:bg-muted rounded w-full mb-1"></div>
                    <div className="h-3 bg-muted dark:bg-muted rounded w-1/4"></div>
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
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Critical Alerts</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Flagged transactions requiring attention</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.alertType);
                const severityVariant = getSeverityColor(alert.severity);
                const bgColor = getSeverityBgColor(alert.severity);

                return (
                  <div
                    key={alert.id}
                    className={`p-4 ${bgColor} rounded-lg border cursor-pointer hover:opacity-80 transition-opacity`}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertIcon className={`mt-1 w-4 h-4 ${
                          alert.severity === "critical" ? "text-destructive dark:text-destructive" :
                          alert.severity === "high" ? "text-chart-3 dark:text-chart-3" :
                          "text-chart-1 dark:text-chart-1"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{alert.description}</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            {new Date(alert.createdAt!).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={severityVariant as any} className="capitalize">
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground dark:text-muted-foreground">No critical alerts</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
