"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, RotateCcw, Trash2, Plus, Key, Lock, BarChart3, AlertCircle, CheckCircle, Info, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Layout } from "@/components/layout/Layout";

interface ApiKey {
  id: string;
  name: string;
  key: string | null;
  key_hash: string;
  partner_id: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  // user_id and active can be added if you use them
}

interface DeveloperProfile {
  partner_id: string | null;
  company_name: string | null;
  website: string | null;
  api_usage_plan: string | null;
  monthly_request_limit: number | null;
}

export default function ApiManagementPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDeveloperProfile();
      fetchApiKeys();
    }
  }, [user]);

  const fetchDeveloperProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('developer_profiles')
        .select('partner_id, company_name, website, api_usage_plan, monthly_request_limit')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      setDeveloperProfile(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch developer profile",
        variant: "destructive",
      });
    }
  };

  const fetchApiKeys = async () => {
    if (!user?.id) return; // <-- Fix: Ensure user.id is defined
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id) // <-- Now always a string
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApiKeys((data ?? []) as ApiKey[]);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const prefix = 'wm_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return prefix + randomPart;
  };

  const hashApiKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createApiKey = async () => {
    if (!newKeyName.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);

      const { data: profile, error: profileError } = await supabase
        .from('developer_profiles')
        .select('partner_id')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName.trim(),
          key: apiKey,
          key_hash: keyHash,
          partner_id: profile?.partner_id ?? null,
          user_id: user.id,
          is_active: true,
          rate_limit_per_minute: 60
        })
        .select()
        .single();
      if (error) throw error;

      setApiKeys(prev => [data as ApiKey, ...prev]);
      setGeneratedKey(apiKey); // <-- Show the key to the user
      setNewKeyName('');
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "API key created successfully!",
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Success",
      description: `${label} copied to clipboard!`,
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);
      
      if (error) throw error;
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: !currentStatus } : key
      ));
      
      toast({
        title: "Success",
        description: `API key ${!currentStatus ? 'enabled' : 'disabled'} successfully!`,
      });
    } catch (error) {
      console.error('Error toggling API key status:', error);
      toast({
        title: "Error",
        description: "Failed to update API key status",
        variant: "destructive",
      });
    }
  };

  const rotateApiKey = async (keyId: string) => {
    try {
      const newApiKey = generateApiKey();
      const newKeyHash = await hashApiKey(newApiKey);

      const { error } = await supabase
        .from('api_keys')
        .update({
          key: newApiKey,
          key_hash: newKeyHash,
          last_used_at: null
        })
        .eq('id', keyId);

      if (error) throw error;
      await fetchApiKeys();
      setGeneratedKey(newApiKey); // <-- Show the new key to the user
      toast({
        title: "Success",
        description: "API key rotated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate API key",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (apiKey: ApiKey) => {
    setKeyToDelete(apiKey);
    setDeleteDialogOpen(true);
  };

  const deleteApiKey = async () => {
    if (!keyToDelete) return;
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyToDelete.id);
      if (error) throw error;
      setApiKeys(prev => prev.filter(key => key.id !== keyToDelete.id));
      toast({
        title: "Success",
        description: "API key deleted successfully!",
      });
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return "";
    if (key.length <= 8) return key;
    const prefix = key.substring(0, 3);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(24)}${suffix}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading API keys...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your API keys, monitor usage, and configure access settings
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {apiKeys.filter(key => key.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    out of {apiKeys.length} total keys
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usage Plan</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {developerProfile?.api_usage_plan || 'Free'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {developerProfile?.monthly_request_limit?.toLocaleString() || '0'} requests/month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partner ID</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono">
                    {developerProfile?.partner_id || 'Loading...'}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs mt-1"
                    onClick={() => copyToClipboard(developerProfile?.partner_id ?? '', 'Partner ID')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">60</div>
                  <p className="text-xs text-muted-foreground">
                    requests per minute
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* API Keys Table */}
            <Card>
              <CardHeader>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys and monitor their usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first API key to start using our services
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>API Key</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Used</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Rate Limit</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiKeys.map((apiKey) => (
                          <TableRow key={apiKey.id}>
                            <TableCell className="font-medium">
                              {apiKey.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="relative rounded bg-muted px-2 py-1 font-mono text-sm">
                                  {visibleKeys.has(apiKey.id) ? apiKey.key ?? "" : maskApiKey(apiKey.key)}
                                </code>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleKeyVisibility(apiKey.id)}
                                  >
                                    {visibleKeys.has(apiKey.id) ? 
                                      <EyeOff className="h-4 w-4" /> : 
                                      <Eye className="h-4 w-4" />
                                    }
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(apiKey.key, 'API Key')}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                                  {apiKey.is_active ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </Badge>
                                <Switch
                                  checked={apiKey.is_active}
                                  onCheckedChange={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never'}
                            </TableCell>
                            <TableCell>
                              {formatDate(apiKey.created_at)}
                            </TableCell>
                            <TableCell>
                              {apiKey.rate_limit_per_minute}/min
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => rotateApiKey(apiKey.id)}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Rotate Key
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(apiKey)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>API Analytics</CardTitle>
                <CardDescription>
                  Monitor your API usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed usage analytics and performance metrics will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>
                  Configure your API access and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Advanced API configuration options will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create API Key Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access our services. Give it a descriptive name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={creating}>
                {creating ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the API key "{keyToDelete?.name}"? 
                This action cannot be undone and will immediately revoke access for this key.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setKeyToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteApiKey}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Show Generated API Key Dialog */}
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
      </div>
    </Layout>
  );
}