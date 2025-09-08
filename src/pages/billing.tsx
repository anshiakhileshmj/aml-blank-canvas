import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Download, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentSubscriptionUsage, getBillingHistory, PLAN_FEATURES, SubscriptionUsage } from "@/lib/billingUtils";

export default function Billing() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [currentUsage, setCurrentUsage] = useState<SubscriptionUsage | null>(null);
  const [billingHistory, setBillingHistory] = useState<SubscriptionUsage[]>([]);

  useEffect(() => {
    const loadBillingData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [usage, history] = await Promise.all([
          getCurrentSubscriptionUsage(),
          getBillingHistory()
        ]);
        
        setCurrentUsage(usage);
        setBillingHistory(history);
      } catch (error) {
        console.error('Error loading billing data:', error);
        toast({
          title: "Error",
          description: "Failed to load billing information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [user, toast]);

  const currentPlan = currentUsage?.plan_type || 'free';
  const usage = {
    apiCalls: currentUsage?.api_calls_used || 0,
    apiLimit: currentUsage?.api_calls_limit || 1000,
    overage: currentUsage?.overage_charges || 0
  };

  const plans = Object.entries(PLAN_FEATURES).map(([id, plan]) => ({
    id,
    ...plan,
    apiCalls: plan.apiCalls === -1 ? "Unlimited" : plan.apiCalls
  }));

  const handleUpgrade = (planId: string) => {
    toast({
      title: "Upgrade initiated",
      description: `Upgrading to ${plans.find(p => p.id === planId)?.name} plan...`,
    });
  };

  const handleDownloadInvoice = (period: string) => {
    toast({
      title: "Download started",
      description: `Invoice for ${period} is being downloaded.`,
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription and billing information
            </p>
          </div>
          <Button variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
        </div>

        {/* Current Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your usage for this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">API Calls</span>
                <span className="text-sm text-muted-foreground">
                  {usage.apiCalls} / {usage.apiLimit === -1 ? 'unlimited' : usage.apiLimit.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{usage.apiCalls.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  of {usage.apiLimit === -1 ? 'unlimited' : usage.apiLimit.toLocaleString()} API calls
                </div>
              </div>
              <Progress 
                value={usage.apiLimit === -1 ? 0 : (usage.apiCalls / usage.apiLimit) * 100} 
                className="w-full"
              />
            </div>
            
            {usage.overage > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-600">Overage Charges</span>
                  <span className="font-bold text-orange-600">${usage.overage}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">
                  {PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]?.name || 'Free'} Plan
                </h3>
                <p className="text-muted-foreground">
                  ${PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]?.price || 0}/month
                </p>
              </div>
              <Badge variant="default">Current Plan</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 ${
                    plan.id === currentPlan ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="text-2xl font-bold">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.id === currentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.length > 0 ? billingHistory.map((invoice, index) => {
                const period = `${new Date(invoice.billing_period_start).toLocaleDateString()} - ${new Date(invoice.billing_period_end).toLocaleDateString()}`;
                const planFeatures = PLAN_FEATURES[invoice.plan_type as keyof typeof PLAN_FEATURES];
                const amount = planFeatures?.price || 0;
                
                return (
                  <div key={invoice.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{planFeatures?.name || invoice.plan_type} Plan</div>
                      <div className="text-sm text-muted-foreground">{period}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">${amount + invoice.overage_charges}</div>
                        <Badge variant="default">paid</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(period)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-muted-foreground">
                  No billing history available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}