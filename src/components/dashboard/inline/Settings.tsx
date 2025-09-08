import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInlineSection } from "@/hooks/useInlineSection";
import { useState } from "react";

export function Settings() {
  const { isOpen } = useInlineSection();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState("medium");
  const [sessionTimeout, setSessionTimeout] = useState("8-hours");

  if (!isOpen("settings")) return null;

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border" data-testid="settings-section">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Settings</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Configure your account preferences and security settings</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Preferences */}
          <div>
            <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground mb-4">Account Preferences</h4>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">Email Notifications</span>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                    data-testid="email-notifications-toggle"
                  />
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">Receive email alerts for high-risk transactions</p>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">SMS Alerts</span>
                  <Switch 
                    checked={smsAlerts} 
                    onCheckedChange={setSmsAlerts}
                    data-testid="sms-alerts-toggle"
                  />
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">Get SMS notifications for critical alerts</p>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <label className="block text-sm text-card-foreground dark:text-card-foreground mb-2">Risk Threshold</label>
                <Select value={riskThreshold} onValueChange={setRiskThreshold}>
                  <SelectTrigger data-testid="risk-threshold-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (80+)</SelectItem>
                    <SelectItem value="medium">Medium (60+)</SelectItem>
                    <SelectItem value="low">Low (40+)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">Minimum risk score for automatic alerts</p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground mb-4">Security Settings</h4>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">Two-Factor Authentication</span>
                  <Badge variant="secondary" className="text-chart-2 dark:text-chart-2">
                    Enabled
                  </Badge>
                </div>
                <Button variant="link" className="text-xs p-0 h-auto" data-testid="manage-2fa">
                  Manage 2FA Settings
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">Password</span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">Last changed: 2 weeks ago</span>
                </div>
                <Button variant="link" className="text-xs p-0 h-auto" data-testid="change-password">
                  Change Password
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">IP Restrictions</span>
                  <Badge variant="outline" className="text-muted-foreground dark:text-muted-foreground">
                    Disabled
                  </Badge>
                </div>
                <Button variant="link" className="text-xs p-0 h-auto" data-testid="configure-ip-whitelist">
                  Configure IP Whitelist
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-card-foreground dark:text-card-foreground">Session Timeout</span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">8 hours</span>
                </div>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="mt-2" data-testid="session-timeout-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-hour">1 hour</SelectItem>
                    <SelectItem value="4-hours">4 hours</SelectItem>
                    <SelectItem value="8-hours">8 hours</SelectItem>
                    <SelectItem value="24-hours">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
