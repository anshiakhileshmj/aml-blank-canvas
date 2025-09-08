import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Copy, Eye, MoreVertical, RotateCcw, Trash2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInlineSection } from "@/hooks/useInlineSection";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserApiKeys, 
  getApiUsageStats, 
  createApiKey as createApiKeyUtil, 
  rotateApiKey as rotateApiKeyUtil, 
  deleteApiKey as deleteApiKeyUtil 
} from "@/lib/apiKeyUtils";

export function ApiManagement() {
  const { isOpen } = useInlineSection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnvironment, setNewKeyEnvironment] = useState("production");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: getUserApiKeys,
    enabled: isOpen("api"),
  });

  const { data: usage } = useQuery({
    queryKey: ["api-usage"],
    queryFn: getApiUsageStats,
    enabled: isOpen("api"),
  });

  const createMutation = useMutation({
    mutationFn: ({ name, environment }: { name: string; environment: string }) =>
      createApiKeyUtil(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-usage"] });
      setGeneratedKey(data.key); // <-- Show the key to the user
      setIsViewDialogOpen(true);
      setIsCreateDialogOpen(false);
      setNewKeyName("");
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (keyId: string) => rotateApiKeyUtil(keyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setGeneratedKey(data.key); // <-- Show the new key to the user
      setIsViewDialogOpen(true);
      toast({
        title: "API Key Rotated",
        description: "Your API key has been rotated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rotate API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => deleteApiKeyUtil(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-usage"] });
      toast({
        title: "API Key Deleted",
        description: "Your API key has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isOpen("api")) return null;

  const currentUsage = usage || {
    callsThisMonth: 0,
    limit: 1670000,
    avgResponseTime: 0,
    successRate: 100,
  };

  const usagePercentage = (currentUsage.callsThisMonth / currentUsage.limit) * 100;

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ name: newKeyName.trim(), environment: newKeyEnvironment });
  };

  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key.",
        variant: "destructive",
      });
    }
  };

  const handleViewApiKey = (key: string) => {
    setSelectedApiKey(key);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
  };

  return (
    <>
      <Card className="bg-card dark:bg-card border-border dark:border-border" data-testid="api-management-section">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-card-foreground">API Management</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Create and manage API keys for AML services</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Keys Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground">API Keys</h4>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="create-api-key">
                      <Plus className="mr-2 w-4 h-4" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="keyName">API Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="Enter API key name"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="environment">Environment</Label>
                        <Select value={newKeyEnvironment} onValueChange={setNewKeyEnvironment}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateApiKey}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending ? "Creating..." : "Create API Key"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-muted dark:bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-muted dark:bg-muted rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-muted dark:bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-muted dark:bg-muted rounded"></div>
                          <div className="w-8 h-8 bg-muted dark:bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 rounded-lg">
                      <div>Name</div>
                      <div>Key Preview</div>
                      <div>Environment</div>
                      <div>Usage</div>
                      <div>Last Used</div>
                      <div>Created</div>
                      <div>Actions</div>
                    </div>
                    {apiKeys.map((apiKey: any) => (
                      <div
                        key={apiKey.id}
                        className="grid grid-cols-7 gap-4 px-4 py-3 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border items-center"
                        data-testid={`api-key-${apiKey.id}`}
                      >
                        <div className="text-sm font-medium text-card-foreground">
                          {apiKey.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {apiKey.key ? `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}` : 'Hidden'}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          Production
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {apiKey.rate_limit_per_minute?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Never"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(apiKey.created_at)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={() => handleCopyApiKey(apiKey.key || '')}
                            data-testid={`copy-key-${apiKey.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={() => handleViewApiKey(apiKey.key || '')}
                            data-testid={`view-key-${apiKey.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8"
                                data-testid={`actions-${apiKey.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border border-border">
                              <DropdownMenuItem
                                onClick={() => rotateMutation.mutate(apiKey.id)}
                                disabled={rotateMutation.isPending}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Rotate Key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(apiKey.id)}
                                disabled={deleteMutation.isPending}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground dark:text-muted-foreground">No API keys found. Create your first API key to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Metrics */}
            <div>
              <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground mb-4">Usage Metrics</h4>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">API Calls This Month</span>
                    <span className="text-sm font-medium text-card-foreground dark:text-card-foreground" data-testid="api-calls-count">
                      {currentUsage.callsThisMonth.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="mb-2" />
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {Math.round(usagePercentage)}% of limit ({currentUsage.limit.toLocaleString()})
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">Average Response Time</span>
                    <span className="text-sm font-medium text-card-foreground dark:text-card-foreground" data-testid="avg-response-time">
                      {currentUsage.avgResponseTime}ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-chart-2 dark:text-chart-2 w-4 h-4" />
                    <span className="text-xs text-chart-2 dark:text-chart-2">Excellent performance</span>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium text-card-foreground dark:text-card-foreground" data-testid="success-rate">
                      {currentUsage.successRate}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-chart-2 dark:text-chart-2 w-4 h-4" />
                    <span className="text-xs text-chart-2 dark:text-chart-2">High reliability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View API Key Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Your API Key (Keep this secure!)</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={selectedApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleCopyApiKey(selectedApiKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is the only time you'll see this key. Make sure to copy it now.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated API Key Dialog */}
      {generatedKey && (
        <Dialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Your API Key (copy and store it securely!)</Label>
              <div className="flex items-center space-x-2">
                <Input value={generatedKey} readOnly className="font-mono text-sm" />
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedKey!); toast({ title: "Copied", description: "API key copied to clipboard" }); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is the only time you'll see this key. Make sure to copy it now.
              </p>
              <Button onClick={() => setGeneratedKey(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}