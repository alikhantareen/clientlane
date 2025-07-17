const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkSubscriptionHealth() {
  console.log('🏥 Checking subscription health...');
  console.log('=====================================');

  try {
    // Get all users with active subscriptions
    const usersWithSubscriptions = await prisma.user.findMany({
      where: {
        role: 'freelancer',
        subscriptions: {
          some: {
            is_active: true,
            ends_at: {
              gt: new Date()
            }
          }
        }
      },
      include: {
        subscriptions: {
          where: {
            is_active: true,
            ends_at: {
              gt: new Date()
            }
          },
          include: {
            plan: true
          }
        }
      }
    });

    console.log(`Found ${usersWithSubscriptions.length} users with active subscriptions`);

    let issuesFound = 0;
    let healthyUsers = 0;

    for (const user of usersWithSubscriptions) {
      const subscription = user.subscriptions[0];
      
      // Check if Stripe customer exists
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        console.log(`❌ ${user.email}: Missing Stripe customer (has ${subscription.plan.name} subscription)`);
        issuesFound++;
      } else {
        const customer = customers.data[0];
        
        // Check if customer has subscriptions
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 1,
        });

        if (stripeSubscriptions.data.length === 0) {
          console.log(`⚠️  ${user.email}: Has Stripe customer but no subscriptions`);
          issuesFound++;
        } else {
          console.log(`✅ ${user.email}: Healthy (${subscription.plan.name})`);
          healthyUsers++;
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Healthy users: ${healthyUsers}`);
    console.log(`❌ Issues found: ${issuesFound}`);
    console.log(`📈 Total checked: ${usersWithSubscriptions.length}`);

    if (issuesFound === 0) {
      console.log('\n🎉 All subscriptions are healthy!');
    } else {
      console.log(`\n🔧 Run 'node fix-subscription.js user@example.com' for each user with issues`);
    }

  } catch (error) {
    console.error('❌ Error checking subscription health:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the health check
checkSubscriptionHealth(); 