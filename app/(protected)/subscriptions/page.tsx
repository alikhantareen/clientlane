"use client";

import { Button } from "@/components/ui/button";

// Constants for subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$12',
    period: '/month',
    features: [
      '10 projects',
      '5 GB storage',
      'Basic support'
    ],
    buttonText: 'Subscribe',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24',
    period: '/month',
    features: [
      '50 projects',
      '25 GB storage',
      'Priority support'
    ],
    buttonText: 'Subscribe',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$39',
    period: '/month',
    features: [
      '150 projects',
      '100 GB storage',
      '24/7 support'
    ],
    buttonText: 'Subscribe',
    popular: false,
  }
];

export default function SubscriptionsPage() {
  const handleSubscribe = (planId: string) => {
    // TODO: Implement subscription logic
    console.log(`Subscribing to plan: ${planId}`);
  };

  return (
    <main className="w-full mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 text-lg">Select the perfect plan for your needs</p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col h-full hover:shadow-md transition-shadow duration-200"
            >
              {/* Plan Name */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {plan.name}
                </h2>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 text-lg ml-1">{plan.period}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe Button */}
              <Button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full rounded-md text-sm font-medium bg-black text-white hover:bg-gray-800 hover:text-white cursor-pointer px-4 py-2"
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </main>
  );
} 