import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { TransactionFeed } from "@/components/dashboard/TransactionFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { RiskAnalytics } from "@/components/dashboard/RiskAnalytics";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { CaseManagement } from "@/components/dashboard/CaseManagement";
import { ComplianceReports } from "@/components/dashboard/ComplianceReports";
import { AdvancedFiltering } from "@/components/dashboard/AdvancedFiltering";
import { ApiManagement } from "@/components/dashboard/inline/ApiManagement";
import { Settings } from "@/components/dashboard/inline/Settings";
import { Billing } from "@/components/dashboard/inline/Billing";
import { Profile } from "@/components/dashboard/inline/Profile";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirect to auth if no session
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user || !session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMobileMenuToggle={handleMobileMenuToggle} />

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6" data-testid="dashboard-main">
          {/* Key Metrics Cards */}
          <MetricsCards />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Transaction Feed */}
            <TransactionFeed />

            {/* Alerts Panel */}
            <AlertsPanel />
          </div>

          {/* Risk Analytics and Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Analytics Chart */}
            <RiskAnalytics />

            {/* Geographic Risk Heatmap */}
            <RiskHeatmap />
          </div>

          {/* Inline Management Sections */}
          <ApiManagement />
          <Settings />
          <Billing />
          <Profile />

          {/* Case Management and Compliance Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Management */}
            <CaseManagement />

            {/* Compliance Reports */}
            <ComplianceReports />
          </div>

          {/* Advanced Filtering and Search */}
          <AdvancedFiltering />
        </main>
      </div>
    </div>
  );
}
