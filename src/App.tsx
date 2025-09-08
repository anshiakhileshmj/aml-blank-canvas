import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import TransactionsPage from "@/pages/transactions";
import AlertsPage from "@/pages/alerts";
import CasesPage from "@/pages/cases";
import SanctionsPage from "@/pages/sanctions";
import ReportsPage from "@/pages/reports";
import ApiManagementPage from "@/pages/api-management";
import SettingsPage from "@/pages/settings";
import BillingPage from "@/pages/billing";
import ProfilePage from "@/pages/profile";
import Auth from "@/pages/Auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <TransactionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/alerts">
        <ProtectedRoute>
          <AlertsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/cases">
        <ProtectedRoute>
          <CasesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/sanctions">
        <ProtectedRoute>
          <SanctionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/api-management">
        <ProtectedRoute>
          <ApiManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <BillingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
          <Toaster />
          
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
