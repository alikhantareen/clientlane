const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { startDeadlineNotificationJob } = require('./cron/notify-upcoming-deadlines');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('🚀 Starting ClientLane server...');

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Start the HTTP server
  server
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`);
      
      // Initialize cron jobs after server is ready
      try {
        console.log('🔧 Initializing cron jobs...');
        startDeadlineNotificationJob();
        console.log('✅ All cron jobs initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize cron jobs:', error);
        // Don't exit the process - let the server continue running
        // even if cron jobs fail to initialize
      }
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
    });
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
}); 