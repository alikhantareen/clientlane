# Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe subscriptions for ClientLane.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (you'll get these from Stripe Dashboard)
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_AGENCY_PRICE_ID="price_..."

# Base URL (IMPORTANT: Include the protocol!)
# For development:
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
# For production:
# NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

⚠️ **Important**: The `NEXT_PUBLIC_BASE_URL` must include the protocol (`http://` or `https://`). This is required for Stripe checkout redirects.

## Stripe Dashboard Setup

### 1. Create Products and Prices

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products) and create:

#### 🟩 Free Plan
- **Name**: Free Plan
- **Description**: 1 client portal
- **Price**: $0/month (Recurring)
- **Note**: You don't need a Price ID for this since it's free

#### 🟨 Pro Plan
- **Name**: Pro Plan
- **Description**: Up to 5 clients
- **Price**: $9/month (Recurring)
- **Billing Period**: Monthly
- ✅ Copy the Price ID (starts with `price_`) to `STRIPE_PRO_PRICE_ID`

#### 🟥 Agency Plan
- **Name**: Agency Plan
- **Description**: Unlimited clients
- **Price**: $29/month (Recurring)  
- **Billing Period**: Monthly
- ✅ Copy the Price ID (starts with `price_`) to `STRIPE_AGENCY_PRICE_ID`

### 2. Enable Customer Portal

1. Go to [Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
2. ✅ Enable the portal
3. Select: **Allow customers to cancel, update, and manage subscriptions**
4. Configure allowed operations:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View billing history
   - ✅ Update billing address

### 3. Set Up Webhooks

1. Go to [Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
   - For local development: Use [ngrok](https://ngrok.com/) or similar to expose localhost
   - Example: `https://abc123.ngrok.io/api/stripe/webhook`

4. **Select events**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. After creation, copy the **Webhook signing secret** (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET`

## Database Setup

Run the database seed to create subscription plans:

```bash
npm run db:seed
```

## Testing Setup

### Test Cards

Use these test card numbers in Stripe checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

### Test Flow

1. Go to `/subscriptions` in your app
2. Click "Upgrade" on Pro or Agency plan
3. Complete checkout with test card
4. Verify webhook receives events
5. Check subscription appears in `/subscriptions`
6. Test "Manage Billing" button opens customer portal

## Subscription Features Implemented

### ✅ Frontend (UI)
- Subscription plans page with Free/Pro/Agency tiers
- Current subscription display
- Upgrade/manage billing buttons
- Loading states and error handling

### ✅ Backend (API Routes)
- `/api/subscriptions/checkout` - Create Stripe checkout session
- `/api/subscriptions/current` - Get user's active subscription
- `/api/subscriptions/portal` - Access customer portal
- `/api/stripe/webhook` - Handle Stripe events

### ✅ Database Integration
- Subscription tracking in database
- Plan management
- Webhook event processing

### ✅ Business Logic
- Free plan: 1 client portal limit
- Pro plan: 5 client portal limit  
- Agency plan: Unlimited portals
- 14-day free trial on paid plans
- Subscription status enforcement

## Next Steps

1. **Production Setup**:
   - Replace test keys with live keys
   - Update webhook URL to production domain
   - Test with real payment methods

2. **Additional Features** (optional):
   - Email notifications for failed payments
   - Usage analytics and reporting
   - Annual billing discounts
   - Team member management
   - Custom branding features

## Troubleshooting

### Common Issues

1. **"Invalid URL" error in checkout**:
   - ❌ Wrong: `NEXT_PUBLIC_BASE_URL="localhost:3000"`
   - ✅ Correct: `NEXT_PUBLIC_BASE_URL="http://localhost:3000"`
   - Make sure to include `http://` or `https://`

2. **Webhook not receiving events**:
   - Check endpoint URL is publicly accessible
   - Verify webhook secret is correct
   - Check webhook events are properly selected

3. **Subscription not appearing**:
   - Check webhook events are being processed
   - Verify user metadata in Stripe dashboard
   - Check database for subscription records

4. **Checkout session fails**:
   - Verify price IDs are correct
   - Check Stripe secret key is valid
   - Ensure products are active in Stripe

5. **"Stripe not configured" errors**:
   - Check all required environment variables are set
   - Restart your development server after adding env vars
   - Verify no typos in environment variable names

### Environment Variable Checklist

Make sure you have all of these in `.env.local`:

- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_`)
- ✅ `STRIPE_SECRET_KEY` (starts with `sk_`)
- ✅ `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
- ✅ `STRIPE_PRO_PRICE_ID` (starts with `price_`)
- ✅ `STRIPE_AGENCY_PRICE_ID` (starts with `price_`)
- ✅ `NEXT_PUBLIC_BASE_URL` (includes `http://` or `https://`)

### Support

If you need help:
- Check [Stripe Documentation](https://stripe.com/docs)
- Review webhook logs in Stripe Dashboard
- Check application logs for error details

---

🎉 **You're all set!** Your Stripe subscription system is ready to handle payments and manage customer subscriptions. 