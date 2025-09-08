import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Filter, CheckCircle, Clock, User, Archive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout } from "@/components/layout/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { supabase } from "@/integrations/supabase/client";


const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "destructive";
    case "high": return "secondary";
    case "medium": return "outline";
    default: return "default";
  }
};

const getAlertTypeIcon = (alertType: string) => {
  switch (alertType) {
    case "sanctions": return "🚫";
    case "pep": return "👤";
    case "unusual_pattern": return "📊";
    case "threshold": return "⚠️";
    default: return "🔍";
  }
};

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["alerts", { search: searchQuery, severity: severityFilter, status: statusFilter, type: typeFilter }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "resolved" && alert.isResolved) ||
      (statusFilter === "unresolved" && !alert.isResolved);
    const matchesType = typeFilter === "all" || alert.alertType === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  }) || [];

  const criticalCount = filteredAlerts.filter(alert => alert.severity === "critical" && !alert.isResolved).length;
  const unresolvedCount = filteredAlerts.filter(alert => !alert.isResolved).length;

  return (
    <Layout>
      <div className="relative">
        <ComingSoonOverlay
          title="Alert Management"
          emoji="🚨"
          description="Advanced alert monitoring and compliance management features are currently under development. Stay tuned for enhanced suspicious activity detection and real-time notifications!"
        />
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground">Monitor and manage compliance alerts</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-mark-all-read">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-alerts">
                {filteredAlerts.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-critical">
                {criticalCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-unresolved">
                {unresolvedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-resolution-rate">
                {alerts && alerts.length > 0 
                  ? Math.round((alerts.filter(a => a.isResolved).length / alerts.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger data-testid="select-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sanctions">Sanctions</SelectItem>
                    <SelectItem value="pep">PEP</SelectItem>
                    <SelectItem value="unusual_pattern">Unusual Pattern</SelectItem>
                    <SelectItem value="threshold">Threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Management</CardTitle>
            <CardDescription>Review and resolve compliance alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading alerts...
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} data-testid={`alert-${alert.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {alert.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getAlertTypeIcon(alert.alertType)}</span>
                          <Badge variant="outline" className="capitalize">
                            {alert.alertType.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(alert.severity)} className="capitalize">
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{alert.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {alert.isResolved ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600">Resolved</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-orange-600">Open</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(alert.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!alert.isResolved && (
                            <Button variant="ghost" size="sm" data-testid={`button-resolve-${alert.id}`}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" data-testid={`button-archive-${alert.id}`}>
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
}