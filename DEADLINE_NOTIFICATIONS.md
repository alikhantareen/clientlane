# Deadline Notification System

This document describes the automated deadline notification system implemented for ClientLane.

## Overview

The system automatically notifies freelancers when their portal (project) deadlines are exactly 7 days away. The notifications are sent once daily at 9:00 AM server time using a cron job.

## Features

- ✅ **Daily Automated Checks**: Runs every day at 9:00 AM server time
- ✅ **7-Day Advance Notice**: Notifies freelancers exactly 7 days before deadlines
- ✅ **Duplicate Prevention**: Prevents multiple notifications for the same portal within 24 hours
- ✅ **Real-time Integration**: Uses existing notification system with live updates via polling
- ✅ **Portal Filtering**: Only checks active portals with valid due dates
- ✅ **Manual Testing**: API endpoint available for manual triggering and testing

## Implementation

### 1. Database Schema

Added `deadline_reminder` to the `NotificationType` enum in `prisma/schema.prisma`:

```prisma
enum NotificationType {
  new_comment
  file_uploaded
  portal_updated
  new_update
  deadline_reminder  // ← New type added
}
```

### 2. Cron Job Logic

**File**: `cron/notify-upcoming-deadlines.js`

The cron job performs the following steps:
1. Calculates the target date (7 days from current date)
2. Queries for active portals with `dueDate` matching the target date
3. Checks for existing deadline notifications within the last 24 hours to prevent duplicates
4. Creates notifications for freelancers who created the portals
5. Batch inserts notifications into the database

### 3. Server Integration

**File**: `server.js`

A custom Next.js server was created to:
- Handle the Next.js application
- Initialize the cron job on server startup
- Provide graceful shutdown handling

Updated `package.json` scripts:
- `npm run dev` - Starts development server with cron jobs
- `npm run start` - Starts production server with cron jobs
- `npm run dev:turbo` - Original Next.js dev command (without cron jobs)

### 4. Manual Testing API

**Endpoint**: `POST /api/cron/deadline-notifications`

**Authentication**: Requires authenticated freelancer

**Usage**:
```bash
# Test the deadline notification system
curl -X POST http://localhost:3000/api/cron/deadline-notifications \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Response**:
```json
{
  "message": "Deadline notification check completed successfully",
  "timestamp": "2024-01-17T18:14:55.000Z"
}
```

### 5. UI Integration

Updated notification icon mappings in:
- `app/(protected)/notifications/page.tsx`
- `components/TopNavigation.tsx` 
- `components/Navbar.tsx`

Deadline reminders display with a ⏰ icon.

## Notification Message Format

```
Reminder: The deadline for project '[PROJECT_NAME]' is in 7 days.
```

## Configuration

### Cron Schedule
```javascript
// Runs daily at 9:00 AM server time
cron.schedule('0 9 * * *', checkUpcomingDeadlines, {
  scheduled: true,
  timezone: "America/New_York" // Adjust as needed
});
```

### Duplicate Prevention
- Checks for existing `deadline_reminder` notifications for the same portal
- Within the last 24 hours
- Prevents spam and multiple notifications

## Portal Date Format

The system expects portal `dueDate` to be stored as ISO string format:
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

The cron job matches against the date portion (YYYY-MM-DD) using `startsWith`.

## Live Notifications

While the system doesn't use WebSockets, it integrates with the existing notification polling system:

- **Polling Interval**: 30 seconds
- **Real-time Updates**: Notifications appear in UI within 30 seconds
- **Notification Bell**: Shows unread count including deadline reminders

## Testing

### 1. Manual API Testing
```bash
# Login to the application first, then:
curl -X POST http://localhost:3000/api/cron/deadline-notifications \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 2. Database Testing
Create a test portal with a due date exactly 7 days from now:

```sql
-- Update an existing portal to have a deadline in 7 days
UPDATE "Portal" 
SET "dueDate" = (CURRENT_DATE + INTERVAL '7 days')::text 
WHERE id = 'your-portal-id';
```

### 3. Cron Schedule Testing
For testing purposes, you can temporarily modify the cron schedule in `cron/notify-upcoming-deadlines.js`:

```javascript
// Test every minute (for development only)
cron.schedule('* * * * *', checkUpcomingDeadlines, {
  scheduled: true
});
```

## Monitoring

The cron job outputs detailed logs:
- ✅ Successful runs
- ❌ Error conditions  
- 📊 Statistics (portals found, notifications created)
- 🔄 Duplicate filtering results

Check server logs for monitoring:
```bash
# Development
npm run dev

# Production  
npm run start
```

## Troubleshooting

### Common Issues

1. **Cron job not starting**
   - Check server logs for initialization errors
   - Verify node-cron dependency is installed
   - Ensure custom server.js is being used

2. **No notifications created**
   - Verify portal has `dueDate` set exactly 7 days from now
   - Check portal status is 'active'
   - Confirm no duplicate notifications exist within 24 hours

3. **TypeScript errors**
   - Run `npx prisma generate` after schema changes
   - Restart development server

4. **Database connection issues**
   - Verify DATABASE_URL environment variable
   - Check Prisma client initialization

## Future Enhancements

Potential improvements to consider:
- [ ] Configurable notification timing (not just 7 days)
- [ ] Multiple reminder intervals (7 days, 3 days, 1 day)
- [ ] Email notifications in addition to in-app
- [ ] WebSocket implementation for truly real-time notifications
- [ ] Admin dashboard for cron job monitoring
- [ ] Timezone-aware scheduling per user
- [ ] Notification preferences per user 