import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ensureStripe } from "@/lib/config/stripe";
import { getPlanById } from "@/lib/config/stripe";
import { prisma } from "@/lib/prisma";

// Helper function to get proper base URL
function getBaseUrl(req: NextRequest): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    // Ensure it has a scheme
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      return baseUrl;
    }
    // Add http:// if missing
    return `http://${baseUrl}`;
  }
  
  // Fallback: construct from request headers
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Final fallback for development
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure Stripe is configured
    let stripe;
    try {
      stripe = ensureStripe();
    } catch (error) {
      return NextResponse.json({ 
        error: "Stripe not configured. Please set up your Stripe environment variables." 
      }, { status: 500 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can subscribe to plans" }, { status: 403 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Get plan configuration
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    if (planId === 'free') {
      return NextResponse.json({ error: "Free plan doesn't require checkout" }, { status: 400 });
    }

    if (!plan.priceId) {
      return NextResponse.json({ error: "Plan price ID not configured. Please set up your Stripe products." }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        user_id: user.id,
        is_active: true,
        ends_at: {
          gt: new Date()
        }
      },
      include: {
        plan: true
      }
    });

    // Get base URL for redirects
    const baseUrl = getBaseUrl(req);

    // Create or get Stripe customer
    let customerId: string;
    
    try {
      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
            role: user.role,
          },
        });
        customerId = customer.id;
      }
    } catch (error) {
      console.error('Stripe customer error:', error);
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    try {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscriptions?canceled=true`,
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            planId: plan.id,
          },
          trial_period_days: 14, // 14-day free trial
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      });

      return NextResponse.json({ 
        url: session.url,
        sessionId: session.id 
      });

    } catch (error) {
      console.error('Stripe session error:', error);
      return NextResponse.json({ 
        error: "Failed to create checkout session" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 