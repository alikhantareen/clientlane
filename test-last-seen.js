const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLastSeen() {
  try {
    console.log('Testing last_seen_at field values...\n');

    // Get all users with their last_seen_at and latest activity
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        last_seen_at: true,
        created_at: true,
        activities: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { created_at: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      const latestActivity = user.activities[0]?.created_at;
      const lastSeen = user.last_seen_at;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      let status = 'unknown';
      if (user.role === 'client') {
        if (!user.last_seen_at && latestActivity && latestActivity > thirtyDaysAgo) {
          status = 'active (based on activity)';
        } else if (lastSeen && lastSeen > thirtyDaysAgo) {
          status = 'active';
        } else {
          status = 'inactive';
        }
      }

      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Last Seen: ${lastSeen ? lastSeen.toISOString() : 'Never'}`);
      console.log(`   Latest Activity: ${latestActivity ? latestActivity.toISOString() : 'None'}`);
      console.log(`   Status: ${status}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error testing last_seen_at:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLastSeen(); 