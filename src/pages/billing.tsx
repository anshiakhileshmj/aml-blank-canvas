import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Download, Check, Star, Zap, Building, Calendar, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";


const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses getting started with AML compliance",
    price: 99,
    period: "month",
    icon: Star,
    features: [
      "Up to 1,000 transaction checks/month",
      "Basic risk scoring",
      "Email support",
      "Standard sanctions lists",
      "Basic reporting",
      "API access"
    ],
    limits: {
      transactions: "1,000",
      apiCalls: "5,000",
      reports: "5",
      support: "Email"
    }
  },
  {
    id: "professional",
    name: "Professional",
    description: "Advanced features for growing fintech companies",
    price: 299,
    period: "month",
    icon: Zap,
    popular: true,
    features: [
      "Up to 10,000 transaction checks/month",
      "Advanced risk scoring with ML",
      "Priority email & chat support",
      "Enhanced sanctions lists + PEP",
      "Advanced reporting & analytics",
      "Webhook integrations",
      "Custom risk rules",
      "Real-time monitoring"
    ],
    limits: {
      transactions: "10,000",
      apiCalls: "50,000",
      reports: "Unlimited",
      support: "Priority"
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full-scale compliance solution for large institutions",
    price: 999,
    period: "month",
    icon: Building,
    features: [
      "Unlimited transaction checks",
      "Custom risk model training",
      "24/7 phone & dedicated support",
      "Global sanctions lists + custom lists",
      "White-label reporting",
      "Advanced webhook & SSO",
      "Custom compliance workflows",
      "On-premise deployment options",
      "SLA guarantees",
      "Dedicated account manager"
    ],
    limits: {
      transactions: "Unlimited",
      apiCalls: "Unlimited",
      reports: "Unlimited",
      support: "24/7 Dedicated"
    }
  }
];

export default function BillingPage() {
  const [currentPlan] = useState("professional");
  const { toast } = useToast();

  const { data: subscription = {}, isLoading: subscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ["/api/subscription"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: billingHistory = [], isLoading: billingLoading, error: billingError } = useQuery({
    queryKey: ["/api/billing-history"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handlePlanChange = (planId: string) => {
    toast({
      title: "Plan Change Requested",
      description: `Upgrading to ${plans.find(p => p.id === planId)?.name} plan. You'll be redirected to payment.`,
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Started",
      description: "Your invoice is being downloaded.",
    });
  };

  const currentPlanData = plans.find(p => p.id === currentPlan);
  const totalSpent = billingHistory?.reduce((sum, bill) => sum + parseFloat(bill.amount), 0) || 0;
  const thisMonthUsage = 7543; // Mock data
  const thisMonthLimit = currentPlanData?.limits.transactions === "Unlimited" ? "∞" : (currentPlanData?.limits.transactions || "0");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
          </div>
          <Button variant="outline" data-testid="button-billing-portal">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing Portal
          </Button>
        </div>

        {/* Current Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-current-plan">
                {currentPlanData?.name}
              </div>
              <p className="text-xs text-muted-foreground">
                ${currentPlanData?.price}/month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Usage</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-usage">
                {thisMonthUsage.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                of {thisMonthLimit} checks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-next-billing">
                Jan 15
              </div>
              <p className="text-xs text-muted-foreground">
                ${currentPlanData?.price} due
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
            <TabsTrigger value="usage">Usage Details</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Subscription Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = plan.id === currentPlan;
                
                return (
                  <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                      <div className="text-3xl font-bold">
                        ${plan.price}
                        <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-4">
                        {isCurrentPlan ? (
                          <Button variant="outline" className="w-full" disabled>
                            Current Plan
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            variant={plan.popular ? "default" : "outline"}
                            onClick={() => handlePlanChange(plan.id)}
                            data-testid={`button-select-${plan.id}`}
                          >
                            {plan.price > (currentPlanData?.price || 0) ? 'Upgrade' : 'Downgrade'} to {plan.name}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Your payment history and invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory && billingHistory.length > 0 ? (
                      billingHistory.map((bill) => (
                        <TableRow key={bill.id} data-testid={`billing-${bill.id}`}>
                          <TableCell className="font-mono text-sm">
                            {bill.invoiceNumber}
                          </TableCell>
                          <TableCell>{bill.description}</TableCell>
                          <TableCell className="font-medium">
                            ${parseFloat(bill.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={bill.status === "paid" ? "default" : "secondary"} className="capitalize">
                              {bill.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(bill.billingDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(bill.id)}
                              data-testid={`button-download-${bill.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No billing history available</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {/* Usage Details */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Breakdown</CardTitle>
                <CardDescription>Detailed usage statistics for your current billing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Transaction Checks</span>
                        <span>{thisMonthUsage.toLocaleString()} / {thisMonthLimit}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: thisMonthLimit === "∞" ? "40%" : `${(thisMonthUsage / parseInt(thisMonthLimit.replace(",", ""))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Calls</span>
                        <span>23,456 / {currentPlanData?.limits.apiCalls}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{ width: "47%" }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">156</div>
                      <div className="text-sm text-muted-foreground">Reports Generated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">98.9%</div>
                      <div className="text-sm text-muted-foreground">API Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">47ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}