import { useState } from "react";
import { Settings, Bell, Shield, Globe, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Notification Settings
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    alertThreshold: "high",
    
    // Security Settings
    twoFactorAuth: false,
    ipWhitelist: "",
    sessionTimeout: "24",
    
    // API Settings
    rateLimit: "1000",
    webhookUrl: "",
    retryAttempts: "3",
    
    // Compliance Settings
    autoReporting: true,
    pepMonitoring: true,
    sanctionsUpdates: true,
    riskThreshold: "70",
    
  });

  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // Simulate API call
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Configure your AML dashboard preferences</p>
          </div>
          <Button onClick={handleSaveSettings} data-testid="button-save-settings">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure how you receive alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-alerts">Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch
                id="email-alerts"
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => handleSettingChange("emailAlerts", checked)}
                data-testid="switch-email-alerts"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-alerts">SMS Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
              </div>
              <Switch
                id="sms-alerts"
                checked={settings.smsAlerts}
                onCheckedChange={(checked) => handleSettingChange("smsAlerts", checked)}
                data-testid="switch-sms-alerts"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                data-testid="switch-push-notifications"
              />
            </div>
            <div>
              <Label htmlFor="alert-threshold">Alert Threshold</Label>
              <Select value={settings.alertThreshold} onValueChange={(value) => handleSettingChange("alertThreshold", value)}>
                <SelectTrigger data-testid="select-alert-threshold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="medium">Medium & High</SelectItem>
                  <SelectItem value="high">High & Critical</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage account security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                data-testid="switch-two-factor"
              />
            </div>
            <div>
              <Label htmlFor="ip-whitelist">IP Whitelist</Label>
              <Textarea
                id="ip-whitelist"
                placeholder="Enter IP addresses or ranges (one per line)"
                value={settings.ipWhitelist}
                onChange={(e) => handleSettingChange("ipWhitelist", e.target.value)}
                data-testid="textarea-ip-whitelist"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Restrict API access to specific IP addresses
              </p>
            </div>
            <div>
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                data-testid="input-session-timeout"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              API Settings
            </CardTitle>
            <CardDescription>Configure API behavior and integration settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rate-limit">Rate Limit (requests per hour)</Label>
              <Input
                id="rate-limit"
                type="number"
                value={settings.rateLimit}
                onChange={(e) => handleSettingChange("rateLimit", e.target.value)}
                data-testid="input-rate-limit"
              />
            </div>
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={settings.webhookUrl}
                onChange={(e) => handleSettingChange("webhookUrl", e.target.value)}
                data-testid="input-webhook-url"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Receive real-time notifications about critical events
              </p>
            </div>
            <div>
              <Label htmlFor="retry-attempts">Retry Attempts</Label>
              <Select value={settings.retryAttempts} onValueChange={(value) => handleSettingChange("retryAttempts", value)}>
                <SelectTrigger data-testid="select-retry-attempts">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Compliance Settings
            </CardTitle>
            <CardDescription>Configure automated compliance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-reporting">Automatic Reporting</Label>
                <p className="text-sm text-muted-foreground">Generate compliance reports automatically</p>
              </div>
              <Switch
                id="auto-reporting"
                checked={settings.autoReporting}
                onCheckedChange={(checked) => handleSettingChange("autoReporting", checked)}
                data-testid="switch-auto-reporting"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pep-monitoring">PEP Monitoring</Label>
                <p className="text-sm text-muted-foreground">Monitor for politically exposed persons</p>
              </div>
              <Switch
                id="pep-monitoring"
                checked={settings.pepMonitoring}
                onCheckedChange={(checked) => handleSettingChange("pepMonitoring", checked)}
                data-testid="switch-pep-monitoring"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sanctions-updates">Sanctions List Updates</Label>
                <p className="text-sm text-muted-foreground">Automatic sanctions list synchronization</p>
              </div>
              <Switch
                id="sanctions-updates"
                checked={settings.sanctionsUpdates}
                onCheckedChange={(checked) => handleSettingChange("sanctionsUpdates", checked)}
                data-testid="switch-sanctions-updates"
              />
            </div>
            <div>
              <Label htmlFor="risk-threshold">Risk Score Threshold</Label>
              <Input
                id="risk-threshold"
                type="number"
                min="0"
                max="100"
                value={settings.riskThreshold}
                onChange={(e) => handleSettingChange("riskThreshold", e.target.value)}
                data-testid="input-risk-threshold"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Transactions above this score will be flagged
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}