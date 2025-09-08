// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


export function ComplianceReports() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground dark:text-card-foreground">Compliance Reports</CardTitle>
            <Button size="sm" data-testid="generate-report-button">
              <FileText className="mr-2 w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse p-3 bg-muted/30 dark:bg-muted/30 border border-border dark:border-border rounded-lg">
                  <div className="w-6 h-6 bg-muted dark:bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted dark:bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted dark:bg-muted rounded w-full mb-1"></div>
                      <div className="h-3 bg-muted dark:bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-muted dark:bg-muted rounded"></div>
                      <div className="w-8 h-8 bg-muted dark:bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground dark:text-card-foreground">Compliance Reports</CardTitle>
          <Button size="sm" data-testid="generate-report-button">
            <FileText className="mr-2 w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Report Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start bg-muted/30 dark:bg-muted/30 border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50"
              data-testid="sar-report-button"
            >
              <div>
                <FileText className="text-destructive dark:text-destructive mb-2 w-5 h-5" />
                <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">SAR Report</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Suspicious Activity Report</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start bg-muted/30 dark:bg-muted/30 border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50"
              data-testid="ctr-report-button"
            >
              <div>
                <FileText className="text-chart-2 dark:text-chart-2 mb-2 w-5 h-5" />
                <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">CTR Report</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Currency Transaction Report</p>
              </div>
            </Button>
          </div>

          {/* Recent Reports */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-card-foreground dark:text-card-foreground">Recent Reports</h4>
            
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors"
                  data-testid={`report-${report.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">{report.title}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        Generated: {new Date(report.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        data-testid={`download-report-${report.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        data-testid={`share-report-${report.id}`}
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground dark:text-muted-foreground">No reports generated yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
