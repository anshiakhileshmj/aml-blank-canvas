import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, Filter, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { supabase } from "@/integrations/supabase/client";


const getReportTypeColor = (type: string) => {
  switch (type) {
    case "sar": return "destructive";
    case "ctr": return "secondary";
    case "monthly": return "outline";
    case "quarterly": return "default";
    default: return "default";
  }
};

const getReportTypeLabel = (type: string) => {
  switch (type) {
    case "sar": return "Suspicious Activity Report";
    case "ctr": return "Currency Transaction Report";
    case "monthly": return "Monthly Summary";
    case "quarterly": return "Quarterly Review";
    default: return type;
  }
};

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReportType, setNewReportType] = useState("monthly");
  const [newReportTitle, setNewReportTitle] = useState("");

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ["reports", { search: searchQuery, type: typeFilter }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filteredReports = reports?.filter(report => {
    const matchesSearch = !searchQuery || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || report.reportType === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  const sarReports = filteredReports.filter(r => r.reportType === "sar").length;
  const ctrReports = filteredReports.filter(r => r.reportType === "ctr").length;
  const monthlyReports = filteredReports.filter(r => r.reportType === "monthly").length;

  return (
    <Layout>
      <div className="relative">
        <ComingSoonOverlay
          title="Compliance Reports"
          emoji="📊"
          description="Advanced reporting and regulatory compliance tools are being built. Automated SAR, CTR, and regulatory submission features will be available soon!"
        />
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>
            <p className="text-muted-foreground">Generate and manage regulatory compliance reports</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-report">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Report</DialogTitle>
                  <DialogDescription>
                    Create a new compliance report for regulatory submission.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={newReportType} onValueChange={setNewReportType}>
                      <SelectTrigger data-testid="select-report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sar">Suspicious Activity Report (SAR)</SelectItem>
                        <SelectItem value="ctr">Currency Transaction Report (CTR)</SelectItem>
                        <SelectItem value="monthly">Monthly Summary</SelectItem>
                        <SelectItem value="quarterly">Quarterly Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="report-title">Report Title</Label>
                    <Input
                      id="report-title"
                      placeholder="Report title..."
                      value={newReportTitle}
                      onChange={(e) => setNewReportTitle(e.target.value)}
                      data-testid="input-report-title"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button data-testid="button-confirm-generate">
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-reports">
                {filteredReports.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SAR Reports</CardTitle>
              <FileText className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-sar">
                {sarReports}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTR Reports</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-ctr">
                {ctrReports}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Reports</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-monthly">
                {monthlyReports}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sar">SAR Reports</SelectItem>
                    <SelectItem value="ctr">CTR Reports</SelectItem>
                    <SelectItem value="monthly">Monthly Reports</SelectItem>
                    <SelectItem value="quarterly">Quarterly Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>Compliance reports and regulatory submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id} data-testid={`report-${report.id}`}>
                      <TableCell className="font-medium">
                        {report.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReportTypeColor(report.reportType)} className="uppercase">
                          {report.reportType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm">
                          {report.description || getReportTypeLabel(report.reportType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">System</span>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-${report.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-download-${report.id}`}>
                            <Download className="w-4 h-4" />
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

        {/* Quick Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Report Templates</CardTitle>
            <CardDescription>Pre-configured report templates for common compliance needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex-col" data-testid="template-suspicious-activity">
                <FileText className="w-6 h-6 mb-2 text-red-500" />
                <span className="text-sm font-medium">Suspicious Activity</span>
                <span className="text-xs text-muted-foreground">Generate SAR</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" data-testid="template-currency-transactions">
                <FileText className="w-6 h-6 mb-2 text-orange-500" />
                <span className="text-sm font-medium">Currency Transactions</span>
                <span className="text-xs text-muted-foreground">Generate CTR</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" data-testid="template-monthly-summary">
                <Calendar className="w-6 h-6 mb-2 text-blue-500" />
                <span className="text-sm font-medium">Monthly Summary</span>
                <span className="text-xs text-muted-foreground">Current Month</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" data-testid="template-risk-assessment">
                <FileText className="w-6 h-6 mb-2 text-purple-500" />
                <span className="text-sm font-medium">Risk Assessment</span>
                <span className="text-xs text-muted-foreground">Portfolio Review</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
}