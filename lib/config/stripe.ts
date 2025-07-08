import Stripe from 'stripe';

// Initialize Stripe with secret key (only if available)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null;

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  // Optional: Static customer portal URL (less secure than dynamic sessions)
  customerPortalUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL,
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Plan',
    description: '1 client portal',
    price: 0,
    priceId: null, // Free plan doesn't need a Stripe price ID
    features: [
      '1 client portal',
      'Unlimited file uploads',
      'Comments & collaboration',
      'Activity feed & notifications',
      'Basic support'
    ],
    clientLimit: 1,
    popular: false,
  },
  PRO: {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Up to 5 clients',
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Up to 5 client portals',
      'Unlimited file uploads',
      'Comments & collaboration',
      'Activity feed & notifications',
      'Priority support',
      'Custom branding',
      'Advanced analytics'
    ],
    clientLimit: 5,
    popular: true,
  },
  AGENCY: {
    id: 'agency',
    name: 'Agency Plan',
    description: 'Unlimited clients',
    price: 29,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID || '',
    features: [
      'Unlimited client portals',
      'Unlimited file uploads',
      'Comments & collaboration',
      'Activity feed & notifications',
      '24/7 priority support',
      'Custom branding',
      'Advanced analytics',
      'White-label solution',
      'API access'
    ],
    clientLimit: null, // null means unlimited
    popular: false,
  },
} as const;

// Helper function to validate Stripe configuration
export function validateStripeConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_AGENCY_PRICE_ID'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing Stripe environment variables: ${missingVars.join(', ')}`);
    console.warn('Stripe functionality will be limited until these are configured.');
    return false;
  }
  
  return true;
}

// Helper function to ensure Stripe is initialized
export function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe not initialized. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
}

// Helper function to get plan by ID
export function getPlanById(planId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.id === planId);
}

// Helper function to get plan by price ID
export function getPlanByPriceId(priceId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId);
}

// Helper function to format price for display
export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price}`;
} 