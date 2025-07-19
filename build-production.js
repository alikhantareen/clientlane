const { execSync } = require('child_process');

console.log('🚀 Starting production build...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Try to deploy migrations first
  console.log('🔄 Attempting to deploy migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations deployed successfully');
  } catch (error) {
    if (error.message.includes('P3005') || error.stdout?.includes('P3005')) {
      console.log('⚠️  Database not empty, using db push instead...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Schema pushed successfully');
    } else {
      throw error;
    }
  }

  // Build Next.js app
  console.log('🏗️  Building Next.js app...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 