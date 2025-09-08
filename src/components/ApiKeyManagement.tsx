import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Eye, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateApiKey, hashApiKey, createApiKeyPreview } from "@/lib/apiKeyUtils";
import { toast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string | null;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  // Add partner_id if you use it elsewhere
  // partner_id?: string | null;
}

export function ApiKeyManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Fetch API keys
  const fetchApiKeys = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false); // <-- Ensure loading is set to false
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  // Create new API key
  const handleCreateApiKey = async () => {
    if (!user || !newKeyName.trim()) return;

    try {
      // Get developer profile for partner_id
      const { data: profile, error: profileError } = await supabase
        .from('developer_profiles')
        .select('partner_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "Profile not found. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          partner_id: profile.partner_id,
          name: newKeyName.trim(),
          key: apiKey,
          key_hash: keyHash,
          is_active: true,
          rate_limit_per_minute: 60
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      setGeneratedKey(apiKey); // <-- Show the key to the user
      setNewKeyName('');
      setShowCreateDialog(false);
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Make sure to copy it now!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  // Rotate API key
  const handleRotateKey = async (keyId: string) => {
    try {
      const newKey = generateApiKey();
      const hashedKey = await hashApiKey(newKey);

      const { error } = await supabase
        .from('api_keys')
        .update({
          key: newKey,
          key_hash: hashedKey,
          last_used_at: null,
        })
        .eq('id', keyId);

      if (error) throw error;

      setGeneratedKey(newKey); // <-- Show the new key to the user
      fetchApiKeys();

      toast({
        title: "API Key Rotated",
        description: "Your API key has been rotated. Make sure to update your applications!",
      });
    } catch (error) {
      console.error('Error rotating API key:', error);
      toast({
        title: "Error",
        description: "Failed to rotate API key",
        variant: "destructive"
      });
    }
  };

  // Delete API key
  const handleDeleteKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      fetchApiKeys();
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error", 
        description: "Failed to delete API key",
        variant: "destructive"
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generated Key Display */}
      {generatedKey && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">New API Key Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 bg-background p-3 rounded border">
              <code className="flex-1 text-sm font-mono">{generatedKey}</code>
              <Button size="sm" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This is the only time you'll see this key. Make sure to save it securely.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setGeneratedKey(null)}
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your API keys for accessing the relay services
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateApiKey} 
                  disabled={!newKeyName.trim()}
                  className="w-full"
                >
                  Create API Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No API keys found. Create your first API key to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {apiKey.key ? `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}` : ''}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apiKey.is_active ? "outline" : "secondary"}>
                        {apiKey.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {apiKey.last_used_at 
                        ? formatDate(apiKey.last_used_at)
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                    <TableCell>
                      {apiKey.rate_limit_per_minute}/min
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRotateKey(apiKey.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Rotate Key
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}