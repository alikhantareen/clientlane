const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Check for portals with deadlines exactly 7 days away
 * and create notifications for freelancers
 */
async function checkUpcomingDeadlines() {
  console.log('🔔 Running deadline notification check at', new Date().toISOString());
  
  try {
    // Calculate the target date (7 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    
    // Format as YYYY-MM-DD to match the date format in database
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    console.log('📅 Checking for deadlines on:', targetDateString);
    
    // Find portals with deadlines exactly 7 days away
    const portalsWithUpcomingDeadlines = await prisma.portal.findMany({
      where: {
        dueDate: {
          startsWith: targetDateString // This handles the date comparison
        },
        status: 'active' // Only check active portals
      },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📋 Found ${portalsWithUpcomingDeadlines.length} portals with deadlines in 7 days`);

    if (portalsWithUpcomingDeadlines.length === 0) {
      console.log('✅ No upcoming deadlines found');
      return;
    }

    // Check for existing deadline reminder notifications to avoid duplicates
    const existingNotifications = await prisma.notification.findMany({
      where: {
        type: 'deadline_reminder',
        portal_id: {
          in: portalsWithUpcomingDeadlines.map(p => p.id)
        },
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      },
      select: {
        portal_id: true
      }
    });

    const notifiedPortalIds = new Set(existingNotifications.map(n => n.portal_id));
    
    // Filter out portals that already have recent deadline notifications
    const portalsToNotify = portalsWithUpcomingDeadlines.filter(
      portal => !notifiedPortalIds.has(portal.id)
    );

    console.log(`🔄 Filtered to ${portalsToNotify.length} portals needing notifications (${notifiedPortalIds.size} already notified recently)`);

    // Create notifications for each portal
    const notifications = [];
    for (const portal of portalsToNotify) {
      const notificationData = {
        user_id: portal.freelancer.id,
        portal_id: portal.id,
        type: 'deadline_reminder',
        message: `Reminder: The deadline for project '${portal.name}' is in 7 days.`,
        link: `/portal/${portal.id}`,
        is_read: false
      };

      notifications.push(notificationData);
      
      console.log(`📬 Prepared notification for freelancer ${portal.freelancer.name} about portal "${portal.name}"`);
    }

    // Batch create all notifications
    if (notifications.length > 0) {
      const createdNotifications = await prisma.notification.createMany({
        data: notifications
      });
      
      console.log(`✅ Successfully created ${createdNotifications.count} deadline reminder notifications`);
    }

  } catch (error) {
    console.error('❌ Error in deadline notification check:', error);
  }
}

/**
 * Start the cron job to run daily at 9:00 AM server time
 */
function startDeadlineNotificationJob() {
  console.log('🚀 Starting deadline notification cron job...');
  
  // Schedule to run daily at 9:00 AM server time
  // Cron expression: '0 9 * * *' means:
  // - 0: minute (0th minute)
  // - 9: hour (9th hour = 9 AM)
  // - *: day of month (every day)
  // - *: month (every month)
  // - *: day of week (every day of week)
  const job = cron.schedule('0 9 * * *', checkUpcomingDeadlines, {
    scheduled: true,
    timezone: "America/New_York" // Adjust timezone as needed
  });

  console.log('⏰ Deadline notification job scheduled to run daily at 9:00 AM');
  
  return job;
}

/**
 * Manual trigger function for testing purposes
 */
async function triggerManualCheck() {
  console.log('🧪 Manual deadline check triggered');
  await checkUpcomingDeadlines();
}

module.exports = {
  startDeadlineNotificationJob,
  triggerManualCheck,
  checkUpcomingDeadlines
}; 