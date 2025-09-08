import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Key, Save, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    department: "",
    location: "",
    bio: "",
    website: "",
    linkedin: "",
    businessType: "",
    joinedDate: "",
    lastLogin: "",
    twoFactorEnabled: false,
    emailVerified: true, // Always verified since users confirm email during signup
    phoneVerified: false,
  });

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive"
          });
          return;
        }

        if (data) {
          setProfile({
            fullName: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email: data.email || user.email || '',
            phone: data.phone || '',
            company: data.company_name || '',
            jobTitle: data.job_title || '',
            department: data.department || '',
            location: data.location || '',
            bio: data.bio || '',
            website: data.company_website || '',
            linkedin: data.linkedin_profile || '',
            businessType: data.business_type || '',
            joinedDate: data.created_at || '',
            lastLogin: user.last_sign_in_at || '',
            twoFactorEnabled: false,
            emailVerified: true,
            phoneVerified: false,
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading your profile.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateUrls = () => {
    const errors: string[] = [];

    // Validate company website
    if (profile.website && profile.website.trim()) {
      const websiteRegex = /^https:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
      if (!websiteRegex.test(profile.website)) {
        errors.push("Company website must start with https:// and include www.");
      }
    }

    // Validate LinkedIn profile
    if (profile.linkedin && profile.linkedin.trim()) {
      if (!profile.linkedin.startsWith('https://')) {
        errors.push("LinkedIn profile must start with https://");
      }
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validate URLs
    const validationErrors = validateUrls();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(' '),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          company_name: profile.company,
          job_title: profile.jobTitle,
          department: profile.department,
          company_website: profile.website,
          linkedin_profile: profile.linkedin,
          business_type: profile.businessType,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been saved successfully.",
        });
      }
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    // Simulate avatar upload
    toast({
      title: "Avatar Upload",
      description: "Avatar upload functionality would be implemented here.",
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="w-32 h-4 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          </div>
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving || loading}
            data-testid="button-save-profile"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="" alt={profile.fullName} />
                      <AvatarFallback className="text-lg">
                        {getInitials(profile.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={handleAvatarUpload}
                      data-testid="button-upload-avatar"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{profile.fullName}</h3>
                    <p className="text-muted-foreground">{profile.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{profile.company}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.email}</span>
                    {profile.emailVerified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                    {!profile.phoneVerified && (
                      <Badge variant="secondary" className="text-xs">Unverified</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(profile.joinedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Auth</span>
                  <Badge variant={profile.twoFactorEnabled ? "default" : "secondary"}>
                    {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Verified</span>
                  <Badge variant={profile.emailVerified ? "default" : "secondary"}>
                    {profile.emailVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone Verified</span>
                  <Badge variant={profile.phoneVerified ? "default" : "secondary"}>
                    {profile.phoneVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-security-settings">
                    <Key className="w-4 h-4 mr-2" />
                    Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={profile.fullName}
                      onChange={(e) => handleProfileUpdate("fullName", e.target.value)}
                      data-testid="input-full-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY"
                      value={profile.location}
                      onChange={(e) => handleProfileUpdate("location", e.target.value)}
                      data-testid="input-location"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your professional background and expertise..."
                    value={profile.bio}
                    onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                    data-testid="textarea-bio"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      disabled
                      className="bg-muted"
                      data-testid="input-company"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      value={profile.jobTitle}
                      disabled
                      className="bg-muted"
                      data-testid="input-job-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-type">Business Type</Label>
                    <Input
                      id="business-type"
                      value={profile.businessType}
                      disabled
                      className="bg-muted"
                      data-testid="input-business-type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Risk & Compliance"
                      value={profile.department}
                      onChange={(e) => handleProfileUpdate("department", e.target.value)}
                      data-testid="input-department"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Company Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.yourcompany.com"
                      value={profile.website}
                      onChange={(e) => handleProfileUpdate("website", e.target.value)}
                      data-testid="input-website"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedin}
                      onChange={(e) => handleProfileUpdate("linkedin", e.target.value)}
                      data-testid="input-linkedin"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Account Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" data-testid="button-change-password">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" data-testid="button-download-data">
                    Download My Data
                  </Button>
                  <Button variant="outline" data-testid="button-verify-phone">
                    <Phone className="w-4 h-4 mr-2" />
                    Verify Phone
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700" data-testid="button-delete-account">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}