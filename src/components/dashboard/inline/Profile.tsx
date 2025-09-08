import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useInlineSection } from "@/hooks/useInlineSection";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
}

interface DeveloperProfile {
  apiLimits: {
    rateLimit: string;
    monthlyQuota: string;
    concurrentConnections: string;
  };
  activityLog: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
  }>;
  accountStatus: {
    verified: boolean;
    status: string;
  };
}

export function Profile() {
  const { isOpen } = useInlineSection();
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: "John Doe",
    email: "john@fintech.com",
    phone: "+1 (555) 123-4567",
    company: "FinTech Solutions Inc.",
    jobTitle: "Senior Compliance Officer",
  });

  const { data: developerProfile, isLoading } = useQuery<DeveloperProfile>({
    queryKey: ["/api/profile", "developer"],
    enabled: isOpen("profile"),
  });

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateProfile = () => {
    // TODO: Implement profile update API call
    console.log("Updating profile:", profileData);
  };

  if (!isOpen("profile")) return null;

  const defaultDeveloperProfile: DeveloperProfile = {
    apiLimits: {
      rateLimit: "1000/minute",
      monthlyQuota: "2,000,000 calls",
      concurrentConnections: "50",
    },
    activityLog: [
      {
        id: "1",
        action: "API Key Created",
        description: "Created new production API key",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        action: "Profile Updated",
        description: "Changed notification preferences",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        action: "Login",
        description: "Signed in from new device",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    accountStatus: {
      verified: true,
      status: "Verified and active",
    },
  };

  const devProfile = developerProfile || defaultDeveloperProfile;

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border" data-testid="profile-section">
      <CardHeader>
        <CardTitle className="text-card-foreground dark:text-card-foreground">Profile</CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage your personal information and developer profile</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div>
            <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground mb-4">Personal Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground"
                  data-testid="input-full-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground"
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground"
                  data-testid="input-phone"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">
                  Company
                </label>
                <Input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground"
                  data-testid="input-company"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground dark:text-card-foreground mb-2">
                  Job Title
                </label>
                <Input
                  type="text"
                  value={profileData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  className="bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground"
                  data-testid="input-job-title"
                />
              </div>
              
              <Button onClick={handleUpdateProfile} data-testid="update-profile-button">
                Update Profile
              </Button>
            </div>
          </div>

          {/* Developer Profile & Limits */}
          <div>
            <h4 className="text-md font-medium text-card-foreground dark:text-card-foreground mb-4">Developer Profile</h4>
            <div className="space-y-4">
              {/* API Limits */}
              <div className="p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                <h5 className="text-sm font-medium text-card-foreground dark:text-card-foreground mb-3">API Limits</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">Rate Limit</span>
                    <span className="text-xs text-card-foreground dark:text-card-foreground" data-testid="rate-limit">
                      {devProfile.apiLimits.rateLimit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">Monthly Quota</span>
                    <span className="text-xs text-card-foreground dark:text-card-foreground" data-testid="monthly-quota">
                      {devProfile.apiLimits.monthlyQuota}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">Concurrent Connections</span>
                    <span className="text-xs text-card-foreground dark:text-card-foreground" data-testid="concurrent-connections">
                      {devProfile.apiLimits.concurrentConnections}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h5 className="text-sm font-medium text-card-foreground dark:text-card-foreground mb-3">Recent Activity</h5>
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse p-3 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-3 bg-muted dark:bg-muted rounded w-1/2 mb-1"></div>
                            <div className="h-2 bg-muted dark:bg-muted rounded w-3/4"></div>
                          </div>
                          <div className="w-16 h-2 bg-muted dark:bg-muted rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    devProfile.activityLog.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border dark:border-border"
                        data-testid={`activity-${activity.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-card-foreground dark:text-card-foreground">
                              {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                              ? `${Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / (1000 * 60 * 60))} hours ago`
                              : `${Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / (1000 * 60 * 60 * 24))} days ago`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="p-4 bg-chart-2/10 dark:bg-chart-2/10 border border-chart-2/20 dark:border-chart-2/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-card-foreground dark:text-card-foreground">Account Status</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">{devProfile.accountStatus.status}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-chart-2 dark:text-chart-2"
                    data-testid="account-status"
                  >
                    <CheckCircle className="mr-1 w-3 h-3" />
                    {devProfile.accountStatus.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
