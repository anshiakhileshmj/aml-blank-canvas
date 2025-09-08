import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, RotateCcw, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function ApiKeyManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create API key mutation  
  const createApiKey = useMutation({
    mutationFn: async (keyName: string) => {
      // Use the secure API key generation from apiKeyUtils
      const { generateApiKey, generateApiSecret, hashApiKey, createApiKeyPreview, checkSubscriptionLimits } = await import('@/lib/apiKeyUtils');
      
      if (!user) throw new Error('User not authenticated');
      
      // Check subscription limits
      const { limits } = await checkSubscriptionLimits(user.id);
      
      // Check if user can create more API keys
      const { data: existingKeys } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (limits.apiKeys !== -1 && (existingKeys?.length || 0) >= limits.apiKeys) {
        throw new Error(`API key limit reached. Your plan allows ${limits.apiKeys} active API keys.`);
      }

      const apiKey = generateApiKey();
      const apiSecret = generateApiSecret();
      const keyHash = await hashApiKey(apiKey);
      const partnerId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          key_name: keyName,
          api_key: apiKey,
          api_secret: apiSecret,
          key_hash: keyHash,
          is_active: true,
          rate_limit_per_minute: 60,
          rate_limit_per_day: limits.apiCalls === -1 ? 999999 : Math.min(limits.apiCalls / 30, 10000),
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, key: apiKey, secret: apiSecret };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsCreateDialogOpen(false);
      setNewKeyName('');
      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    },
  });

  // Delete API key mutation
  const deleteApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    },
  });

  // Toggle API key status mutation
  const toggleApiKey = useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'Success',
        description: 'API key status updated',
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
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

  const formatApiKey = (key: string, keyId: string) => {
    if (visibleKeys.has(keyId)) {
      return key;
    }
    return key.substring(0, 8) + '••••••••••••••••••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage your API keys for accessing the AML API</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key to access the AML compliance API
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createApiKey.mutate(newKeyName)}
                  disabled={!newKeyName || createApiKey.isPending}
                >
                  {createApiKey.isPending ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No API keys found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first API key to start using the AML API
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.key_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {formatApiKey(apiKey.api_key || '', apiKey.id)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.api_key || '')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {apiKey.last_used_at
                      ? new Date(apiKey.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {new Date(apiKey.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleApiKey.mutate({
                            keyId: apiKey.id,
                            isActive: apiKey.is_active,
                          })
                        }
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey.mutate(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}