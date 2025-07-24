# Vercel Deployment Debugging Guide

## Common Causes of Intermittent 500 Errors on Vercel

### 1. Database Connection Issues
- **Cold starts**: Serverless functions may have connection timeouts
- **Connection pooling**: Vercel's serverless environment handles connections differently
- **Environment variables**: Database URL might not be properly set

### 2. Prisma Client Issues
- **Client generation**: Prisma client might not be generated correctly on Vercel
- **Connection limits**: Serverless functions have different connection handling

### 3. Environment Variables
- **Missing variables**: Check if all required env vars are set in Vercel dashboard
- **Variable format**: Ensure DATABASE_URL is properly formatted

## Debugging Steps

### 1. Check Database Health
```bash
# Test database connection
curl https://your-app.vercel.app/api/health/database
```

### 2. Monitor Function Logs
- Go to Vercel Dashboard → Your Project → Functions
- Check the logs for specific error messages
- Look for timeout errors or connection issues

### 3. Test Individual APIs
```bash
# Test each API endpoint
curl https://your-app.vercel.app/api/portals?page=1&limit=1
curl https://your-app.vercel.app/api/plan-limits
curl https://your-app.vercel.app/api/notifications?page=1&limit=10
```

### 4. Use Health Check Script
```bash
# Set your Vercel URL
export VERCEL_URL=https://your-app.vercel.app

# Run health check
npm run vercel:health
```

## Environment Variables to Check

Make sure these are set in your Vercel dashboard:

```env
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Vercel-Specific Optimizations

### 1. Function Timeout
- API routes have a default 10-second timeout
- Increased to 30 seconds in `vercel.json`

### 2. Database Connection
- Prisma client optimized for serverless
- Connection pooling disabled for Vercel

### 3. Build Optimization
- Using `build:simple` command for faster builds
- Prisma client generated during build

## Monitoring and Alerts

### 1. Vercel Analytics
- Enable Vercel Analytics to monitor performance
- Check for function timeouts and errors

### 2. Database Monitoring
- Monitor your database connection pool
- Check for connection timeouts

### 3. Error Tracking
- Consider adding error tracking (Sentry, etc.)
- Monitor API response times

## Quick Fixes

### 1. Restart Functions
- Sometimes functions get stuck in a bad state
- Redeploy to restart all functions

### 2. Check Database
- Ensure database is accessible from Vercel's IP ranges
- Check if database has connection limits

### 3. Environment Variables
- Double-check all environment variables
- Ensure no typos in variable names

## Prevention

### 1. Regular Health Checks
- Set up automated health checks
- Monitor API response times

### 2. Database Optimization
- Use connection pooling appropriately
- Monitor database performance

### 3. Error Handling
- Implement proper error handling
- Add retry logic for transient failures

## Support

If issues persist:
1. Check Vercel status page
2. Review Vercel documentation
3. Contact Vercel support with specific error logs 