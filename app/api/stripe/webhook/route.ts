import { NextRequest, NextResponse } from "next/server";
import { ensureStripe, stripeConfig, getPlanByPriceId } from "@/lib/config/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  // Ensure Stripe is configured
  let stripe;
  try {
    stripe = ensureStripe();
  } catch (error) {
    console.error('Stripe not configured for webhook:', error);
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (!stripeConfig.webhookSecret) {
    console.error('Webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, stripe);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, stripe);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  console.log('Handling checkout completed:', session.id);

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session:', session.metadata);
    return;
  }

  // Get the subscription from Stripe
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  console.log('Subscription object:', JSON.stringify(subscription, null, 2));

  // Get plan configuration
  const plan = getPlanByPriceId(subscription.items.data[0].price.id);
  if (!plan) {
    console.error('Plan not found for price ID:', subscription.items.data[0].price.id);
    return;
  }

  // Create or update plan in database
  let dbPlan = await prisma.plan.findFirst({
    where: { name: plan.name }
  });

  if (!dbPlan) {
    dbPlan = await prisma.plan.create({
      data: {
        name: plan.name,
        price: plan.price,
        currency: 'USD',
        billing_cycle: 'monthly',
        is_active: true
      }
    });
  }

  // Validate dates before creating subscription
  const subscriptionData = subscription as any;
  
  // For trialing subscriptions, use trial_start/trial_end, otherwise use current_period dates
  // Also check items.data[0] for current_period dates as fallback
  const startTimestamp = subscriptionData.current_period_start || 
                        subscriptionData.trial_start || 
                        subscriptionData.start_date ||
                        subscriptionData.items?.data?.[0]?.current_period_start;
  
  const endTimestamp = subscriptionData.current_period_end || 
                      subscriptionData.trial_end ||
                      subscriptionData.items?.data?.[0]?.current_period_end;

  const startDate = startTimestamp ? new Date(startTimestamp * 1000) : new Date();
  const endDate = endTimestamp ? new Date(endTimestamp * 1000) : new Date();

  console.log('Date validation:', {
    status: subscriptionData.status,
    current_period_start: subscriptionData.current_period_start,
    current_period_end: subscriptionData.current_period_end,
    trial_start: subscriptionData.trial_start,
    trial_end: subscriptionData.trial_end,
    start_date: subscriptionData.start_date,
    items_current_period_start: subscriptionData.items?.data?.[0]?.current_period_start,
    items_current_period_end: subscriptionData.items?.data?.[0]?.current_period_end,
    finalStartTimestamp: startTimestamp,
    finalEndTimestamp: endTimestamp,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  // Ensure customer exists and has proper metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if ('metadata' in customer && !customer.metadata?.userId) {
    console.log('Adding userId metadata to customer:', customer.id);
    await stripe.customers.update(customer.id, {
      metadata: {
        userId: userId,
        role: 'freelancer'
      }
    });
  }

  // Create subscription in database
  await prisma.subscription.create({
    data: {
      user_id: userId,
      plan_id: dbPlan.id,
      starts_at: startDate,
      ends_at: endDate,
      is_active: subscription.status === 'active' || subscription.status === 'trialing',
    }
  });

  console.log('Subscription created for user:', userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription updated:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Update subscription in database
  const subscriptionData = subscription as any;
  
  // For trialing subscriptions, use trial_start/trial_end, otherwise use current_period dates
  const startTimestamp = subscriptionData.current_period_start || 
                        subscriptionData.trial_start || 
                        subscriptionData.start_date ||
                        subscriptionData.items?.data?.[0]?.current_period_start;
  
  const endTimestamp = subscriptionData.current_period_end || 
                      subscriptionData.trial_end ||
                      subscriptionData.items?.data?.[0]?.current_period_end;

  const startDate = startTimestamp ? new Date(startTimestamp * 1000) : new Date();
  const endDate = endTimestamp ? new Date(endTimestamp * 1000) : new Date();

  await prisma.subscription.updateMany({
    where: {
      user_id: userId,
      is_active: true
    },
    data: {
      starts_at: startDate,
      ends_at: endDate,
      is_active: subscription.status === 'active' || subscription.status === 'trialing',
      canceled_at: subscription.status === 'canceled' ? new Date() : null
    }
  });

  console.log('Subscription updated for user:', userId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deleted:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Deactivate subscription in database
  await prisma.subscription.updateMany({
    where: {
      user_id: userId,
      is_active: true
    },
    data: {
      is_active: false,
      canceled_at: new Date()
    }
  });

  console.log('Subscription canceled for user:', userId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Handling invoice paid:', invoice.id);

  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Ensure subscription is active after successful payment
  const subscriptionData = subscription as any;
  
  const endTimestamp = subscriptionData.current_period_end || 
                      subscriptionData.trial_end ||
                      subscriptionData.items?.data?.[0]?.current_period_end;

  const endDate = endTimestamp ? new Date(endTimestamp * 1000) : new Date();

  await prisma.subscription.updateMany({
    where: {
      user_id: userId,
      is_active: true
    },
    data: {
      is_active: true,
      ends_at: endDate
    }
  });

  console.log('Invoice paid for user:', userId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Handling invoice payment failed:', invoice.id);

  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // You might want to send an email notification here
  // or implement grace period logic
  console.log('Payment failed for user:', userId);
} 