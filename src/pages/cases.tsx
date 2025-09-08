import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Filter, Plus, User, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout } from "@/components/layout/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { supabase } from "@/integrations/supabase/client";


const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "default";
    case "in_progress": return "secondary";
    case "resolved": return "outline";
    case "closed": return "destructive";
    default: return "default";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "destructive";
    case "high": return "secondary";
    case "medium": return "outline";
    default: return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open": return <FolderOpen className="w-4 h-4 text-blue-500" />;
    case "in_progress": return <Clock className="w-4 h-4 text-orange-500" />;
    case "resolved": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "closed": return <CheckCircle className="w-4 h-4 text-gray-500" />;
    default: return <FolderOpen className="w-4 h-4" />;
  }
};

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ["cases", { search: searchQuery, status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filteredCases = cases?.filter(caseItem => {
    const matchesSearch = !searchQuery || 
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || caseItem.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const openCases = filteredCases.filter(c => c.status === "open").length;
  const inProgressCases = filteredCases.filter(c => c.status === "in_progress").length;
  const urgentCases = filteredCases.filter(c => c.priority === "urgent").length;

  return (
    <Layout>
      <div className="relative">
        <ComingSoonOverlay
          title="Case Management"
          emoji="📁"
          description="Comprehensive investigation and case tracking tools are being developed. Enhanced workflows for compliance investigations and case resolution coming soon!"
        />
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
            <p className="text-muted-foreground">Investigate and manage compliance cases</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button data-testid="button-create-case">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-cases">
                {filteredCases.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-open-cases">
                {openCases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-in-progress">
                {inProgressCases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-urgent-cases">
                {urgentCases}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search cases, case numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Investigation Cases</CardTitle>
            <CardDescription>Active compliance investigations and case tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading cases...
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id} data-testid={`case-${caseItem.id}`}>
                      <TableCell className="font-medium">
                        {caseItem.caseNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {caseItem.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(caseItem.priority)} className="capitalize">
                          {caseItem.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(caseItem.status)}
                          <Badge variant={getStatusColor(caseItem.status)} className="capitalize">
                            {caseItem.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{caseItem.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(caseItem.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(caseItem.updatedAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${caseItem.id}`}>
                          <FolderOpen className="w-4 h-4" />
                        </Button>
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