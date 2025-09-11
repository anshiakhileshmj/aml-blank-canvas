import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, User, Palette, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, updateUserSettings, getNotificationSettings, updateNotificationSettings, UserSettings } from "@/lib/settingsUtils";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    notification_preferences: { email: true, push: false, alerts: true },
    security_settings: { twoFactorEnabled: false, sessionTimeout: 30 },
    display_preferences: { theme: 'system', language: 'en' },
    api_preferences: { defaultRateLimit: 60, webhooksEnabled: false }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    alert_types: ['high_risk', 'sanctions', 'api_limit'],
    email_notifications: true,
    push_notifications: false,
    webhook_url: null as string | null
  });

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    company: '',
    role: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [userSettings, notifSettings] = await Promise.all([
          getUserSettings(),
          getNotificationSettings()
        ]);
        
        if (userSettings) {
          setSettings(userSettings);
        }
        if (notifSettings) {
          setNotificationSettings({
            alert_types: notifSettings.alert_types || ['high_risk', 'sanctions', 'api_limit'],
            email_notifications: notifSettings.email_notifications ?? true,
            push_notifications: notifSettings.push_notifications ?? false,
            webhook_url: notifSettings.webhook_url || null,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, toast]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        updateUserSettings(settings),
        updateNotificationSettings(notificationSettings)
      ]);
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={notificationSettings.email_notifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, email_notifications: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                checked={notificationSettings.push_notifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, push_notifications: checked})
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Alert Types</Label>
              <div className="flex flex-wrap gap-2">
                {["high_risk", "sanctions", "api_limit", "compliance"].map((type) => (
                  <Badge 
                    key={type}
                    variant={notificationSettings.alert_types?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newTypes = notificationSettings.alert_types?.includes(type)
                        ? notificationSettings.alert_types.filter(t => t !== type)
                        : [...(notificationSettings.alert_types || []), type];
                      setNotificationSettings({...notificationSettings, alert_types: newTypes});
                    }}
                  >
                    {type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>Manage your security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.security_settings.twoFactorEnabled}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    security_settings: {
                      ...settings.security_settings,
                      twoFactorEnabled: checked
                    }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={settings.security_settings.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security_settings: {
                    ...settings.security_settings,
                    sessionTimeout: parseInt(e.target.value) || 30
                  }
                })}
                placeholder="30"
              />
            </div>
          </CardContent>
        </Card>


        {/* API Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              API Settings
            </CardTitle>
            <CardDescription>Configure API behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Rate Limit (per minute)</Label>
              <Input
                type="number"
                value={settings.api_preferences.defaultRateLimit}
                onChange={(e) => setSettings({
                  ...settings,
                  api_preferences: {
                    ...settings.api_preferences,
                    defaultRateLimit: parseInt(e.target.value) || 60
                  }
                })}
                placeholder="60"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Webhooks Enabled</Label>
                <p className="text-sm text-muted-foreground">Enable webhook notifications</p>
              </div>
              <Switch
                checked={settings.api_preferences.webhooksEnabled}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings,
                    api_preferences: {
                      ...settings.api_preferences,
                      webhooksEnabled: checked
                    }
                  })
                }
              />
            </div>
            {settings.api_preferences.webhooksEnabled && (
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={notificationSettings.webhook_url || ''}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    webhook_url: e.target.value || null
                  })}
                  placeholder="https://your-domain.com/webhook"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={saving} className="px-8">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}