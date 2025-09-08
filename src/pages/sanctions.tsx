import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldQuestion, Plus, Search, Trash2, AlertTriangle, CheckCircle, Ban, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/layout/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


const getSourceColor = (source: string) => {
  switch (source) {
    case "ofac": return "destructive";
    case "un": return "secondary";
    case "eu": return "outline";
    default: return "default";
  }
};

export default function SanctionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newSource, setNewSource] = useState("manual");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sanctionedWallets = [], isLoading, error } = useQuery({
    queryKey: ["/api/sanctioned-wallets", { search: searchQuery, source: sourceFilter }],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: pepProfiles = [], isLoading: pepLoading, error: pepError } = useQuery({
    queryKey: ["/api/pep-profiles"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const addSanctionMutation = useMutation({
    mutationFn: (data: { address: string; reason: string; source: string }) =>
      apiRequest("POST", "/api/sanctioned-wallets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sanctioned-wallets"] });
      setIsAddDialogOpen(false);
      setNewAddress("");
      setNewReason("");
      setNewSource("manual");
      toast({
        title: "Success",
        description: "Address added to sanctions list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add address to sanctions list",
        variant: "destructive",
      });
    },
  });

  const removeSanctionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/sanctioned-wallets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sanctioned-wallets"] });
      toast({
        title: "Success",
        description: "Address removed from sanctions list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove address from sanctions list",
        variant: "destructive",
      });
    },
  });

  const filteredWallets = sanctionedWallets?.filter(wallet => {
    const matchesSearch = !searchQuery || 
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = sourceFilter === "all" || wallet.source === sourceFilter;
    
    return matchesSearch && matchesSource && wallet.isActive;
  }) || [];

  const handleAddSanction = () => {
    if (!newAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    // Basic Ethereum address validation
    if (!newAddress.startsWith("0x") || newAddress.length !== 42) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    addSanctionMutation.mutate({
      address: newAddress.trim(),
      reason: newReason.trim(),
      source: newSource,
    });
  };

  const totalSanctioned = filteredWallets.length;
  const ofacCount = filteredWallets.filter(w => w.source === "ofac").length;
  const manualCount = filteredWallets.filter(w => w.source === "manual").length;

  return (
    <Layout>
      <div className="relative">
        <ComingSoonOverlay
          title="Sanctions & PEP"
          emoji="🛡️"
          description="Enhanced sanctions screening and PEP monitoring capabilities are in development. Advanced compliance tools for politically exposed persons and sanctions list management coming soon!"
        />
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sanctions & PEP</h1>
            <p className="text-muted-foreground">Manage sanctions lists and politically exposed persons</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-sanction">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Sanctions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sanctioned Address</DialogTitle>
                  <DialogDescription>
                    Add a wallet address to the sanctions list for enhanced monitoring.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Wallet Address</Label>
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      data-testid="input-address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for sanctions (optional)"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      data-testid="textarea-reason"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={newSource} onValueChange={setNewSource}>
                      <SelectTrigger data-testid="select-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="ofac">OFAC</SelectItem>
                        <SelectItem value="un">UN</SelectItem>
                        <SelectItem value="eu">EU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSanction}
                    disabled={addSanctionMutation.isPending}
                    data-testid="button-confirm-add"
                  >
                    {addSanctionMutation.isPending ? "Adding..." : "Add to List"}
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
              <CardTitle className="text-sm font-medium">Total Sanctioned</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-total-sanctioned">
                {totalSanctioned}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OFAC List</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-ofac">
                {ofacCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual Entries</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-manual">
                {manualCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PEP Profiles</CardTitle>
              <ShieldQuestion className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-pep">
                {(pepProfiles && Array.isArray(pepProfiles) ? pepProfiles.length : 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search addresses, reasons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger data-testid="select-source-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="ofac">OFAC</SelectItem>
                    <SelectItem value="un">UN</SelectItem>
                    <SelectItem value="eu">EU</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sanctioned Wallets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sanctioned Wallet Addresses</CardTitle>
            <CardDescription>Blocked addresses from various sanctions lists</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading sanctioned wallets...
                    </TableCell>
                  </TableRow>
                ) : filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No sanctioned wallets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((wallet) => (
                    <TableRow key={wallet.id} data-testid={`wallet-${wallet.id}`}>
                      <TableCell className="font-mono text-sm">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSourceColor(wallet.source!)} className="uppercase">
                          {wallet.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm">
                          {wallet.reason || "No reason provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {wallet.addedBy ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>User</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(wallet.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {wallet.source === "manual" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSanctionMutation.mutate(wallet.id)}
                            disabled={removeSanctionMutation.isPending}
                            data-testid={`button-remove-${wallet.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PEP Monitoring Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Politically Exposed Persons (PEP)
            </CardTitle>
            <CardDescription>Monitor transactions involving politically exposed persons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <ShieldQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>PEP monitoring is active</p>
                <p className="text-sm">Automatic screening against global PEP databases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
}