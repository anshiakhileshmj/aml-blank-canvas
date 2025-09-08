// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "resolved":
      return "default";
    case "in_progress":
      return "secondary";
    case "urgent":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "resolved":
      return "text-chart-2 dark:text-chart-2";
    case "in_progress":
      return "text-chart-3 dark:text-chart-3";
    case "urgent":
      return "text-destructive dark:text-destructive";
    default:
      return "text-muted-foreground dark:text-muted-foreground";
  }
}

export function CaseManagement() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["/api/cases"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card border-border dark:border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground dark:text-card-foreground">Case Management</CardTitle>
            <Button size="sm" data-testid="new-case-button">
              <Plus className="mr-2 w-4 h-4" />
              New Case
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-muted dark:bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-muted dark:bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted dark:bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="w-16 h-6 bg-muted dark:bg-muted rounded"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground dark:text-card-foreground">Case Management</CardTitle>
          <Button size="sm" data-testid="new-case-button">
            <Plus className="mr-2 w-4 h-4" />
            New Case
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cases && cases.length > 0 ? (
            cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors cursor-pointer"
                data-testid={`case-${caseItem.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">{caseItem.caseNumber}</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{caseItem.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      {caseItem.assignedTo && (
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Assigned to: <span className="text-card-foreground dark:text-card-foreground">{caseItem.assignedTo}</span>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Created: {new Date(caseItem.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Badge variant={getStatusVariant(caseItem.status)} className="capitalize">
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground dark:text-muted-foreground">No active cases</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
