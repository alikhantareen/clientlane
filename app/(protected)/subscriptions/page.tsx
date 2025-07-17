"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/config/stripe";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CurrentSubscription {
  id: string;
  plan_id: string;
  is_active: boolean;
  ends_at: string;
  plan: {
    name: string;
    price: number;
  };
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Convert SUBSCRIPTION_PLANS object to array
  const plans = Object.values(SUBSCRIPTION_PLANS);

  // Fetch current subscription
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions/current');
        if (response.ok) {
          const data = await response.json();
          setCurrentSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    }

    if (session?.user) {
      fetchSubscription();
    } else {
      setLoadingSubscription(false);
    }
  }, [session]);

  const handleSubscribe = async (planId: string) => {
    if (!session?.user) {
      toast.error("Please log in to subscribe");
      return;
    }

    // Handle free plan
    if (planId === 'free') {
      toast.info("You're already on the free plan!");
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('manage');

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe customer portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlanId = () => {
    if (!currentSubscription) return 'free';
    if (!currentSubscription.is_active) return 'free';
    
    // Map plan names to IDs
    const planName = currentSubscription.plan.name.toLowerCase();
    console.log(planName, 'planName');
    if (planName.includes('pro')) return 'pro';
    if (planName.includes('agency')) return 'agency';
    return 'free';
  };

  const currentPlanId = getCurrentPlanId();

  return (
    <main className="w-full mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 text-lg">Select the perfect plan for your client portal needs</p>
          
          {loadingSubscription ? (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading subscription...</span>
            </div>
          ) : currentSubscription && currentSubscription.is_active ? (
            <div className="mt-6">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-lg">Current Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentSubscription.plan.name}</p>
                      <p className="text-sm text-gray-500">
                        ${currentSubscription.plan.price}/month
                      </p>
                    </div>
                    <Button 
                      onClick={handleManageBilling}
                      variant="outline"
                      size="sm"
                      disabled={loading === 'manage'}
                      className="cursor-pointer"
                    >
                      {loading === 'manage' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage Billing
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Renews on {new Date(currentSubscription.ends_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isUpgrade = currentPlanId === 'free' && plan.id !== 'free';
            const isDowngrade = currentPlanId !== 'free' && plan.id === 'free';
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border shadow-sm p-8 flex flex-col h-full hover:shadow-md transition-shadow duration-200 ${
                  plan.popular ? 'border-black shadow-lg' : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-black text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Current Plan
                    </Badge>
                  </div>
                )}

                {/* Plan Name */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 text-lg ml-1">/month</span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div className="flex-1 mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full rounded-md text-sm font-medium px-4 py-2 cursor-pointer bg-blue-600 text-white hover:bg-blue-700`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : isUpgrade ? (
                    'Upgrade'
                  ) : isDowngrade ? (
                    'Downgrade'
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            All paid plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Billing powered by <span className="font-medium">Stripe</span> • Secure and compliant
          </p>
        </div>
      </div>
    </main>
  );
} 