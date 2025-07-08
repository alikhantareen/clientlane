import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define plans directly to avoid Stripe import issues during seeding
const PLANS = {
  FREE: {
    name: 'Free Plan',
    price: 0,
  },
  PRO: {
    name: 'Pro Plan', 
    price: 9,
  },
  AGENCY: {
    name: 'Agency Plan',
    price: 29,
  },
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create subscription plans
  console.log('📋 Creating subscription plans...');

  // Helper function to create or update plan
  async function createOrUpdatePlan(planConfig: { name: string; price: number }) {
    const existingPlan = await prisma.plan.findFirst({
      where: { name: planConfig.name }
    });

    if (existingPlan) {
      return await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          price: planConfig.price,
          currency: 'USD',
          billing_cycle: 'monthly',
          is_active: true,
        },
      });
    } else {
      return await prisma.plan.create({
        data: {
          name: planConfig.name,
          price: planConfig.price,
          currency: 'USD',
          billing_cycle: 'monthly',
          is_active: true,
        },
      });
    }
  }

  // Create plans
  const freePlan = await createOrUpdatePlan(PLANS.FREE);
  const proPlan = await createOrUpdatePlan(PLANS.PRO);
  const agencyPlan = await createOrUpdatePlan(PLANS.AGENCY);

  console.log('✅ Subscription plans created:', {
    free: freePlan.id,
    pro: proPlan.id,
    agency: agencyPlan.id,
  });

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 