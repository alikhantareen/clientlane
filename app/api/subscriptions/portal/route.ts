import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ensureStripe } from "@/lib/config/stripe";
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

    // Get user from database with subscription info
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { 
        id: true, 
        email: true, 
        name: true,
        role: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can access billing portal" }, { status: 403 });
    }

    // Get base URL for return redirect
    const baseUrl = getBaseUrl(req);

    try {
      // Find Stripe customer by email
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      let customerId: string;

      if (existingCustomers.data.length === 0) {
        // Check if user has an active subscription in database
        const activeSubscription = await prisma.subscription.findFirst({
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

        if (activeSubscription) {
          // Auto-create Stripe customer for users with active subscriptions
          console.log(`Auto-creating Stripe customer for user ${user.email} with active ${activeSubscription.plan.name} subscription`);
          
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
              userId: user.id,
              role: user.role,
            },
          });

          customerId = customer.id;

          // Optionally create Stripe subscription to match database
          if (activeSubscription.plan.name === 'Pro Plan' && process.env.STRIPE_PRO_PRICE_ID) {
            try {
              await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
                metadata: {
                  userId: user.id,
                  planId: activeSubscription.plan.id,
                },
                trial_end: Math.floor(activeSubscription.ends_at.getTime() / 1000),
                trial_settings: {
                  end_behavior: {
                    missing_payment_method: 'cancel',
                  },
                },
              });
              console.log(`Created Stripe subscription for user ${user.email}`);
            } catch (subError) {
              console.error('Failed to create Stripe subscription:', subError);
              // Continue anyway - customer portal will still work
            }
          } else if (activeSubscription.plan.name === 'Agency Plan' && process.env.STRIPE_AGENCY_PRICE_ID) {
            try {
              await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: process.env.STRIPE_AGENCY_PRICE_ID }],
                metadata: {
                  userId: user.id,
                  planId: activeSubscription.plan.id,
                },
                trial_end: Math.floor(activeSubscription.ends_at.getTime() / 1000),
                trial_settings: {
                  end_behavior: {
                    missing_payment_method: 'cancel',
                  },
                },
              });
              console.log(`Created Stripe subscription for user ${user.email}`);
            } catch (subError) {
              console.error('Failed to create Stripe subscription:', subError);
              // Continue anyway - customer portal will still work
            }
          }
        } else {
          return NextResponse.json({ 
            error: "No billing account found. Please subscribe to a plan first." 
          }, { status: 404 });
        }
      } else {
        customerId = existingCustomers.data[0].id;
      }

      // Create billing portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/subscriptions`,
      });

      return NextResponse.json({ 
        url: portalSession.url 
      });

    } catch (error) {
      console.error('Stripe portal error:', error);
      return NextResponse.json({ 
        error: "Failed to create billing portal session" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Portal API error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 