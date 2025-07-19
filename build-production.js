const { execSync } = require('child_process');

console.log('🚀 Starting production build...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Try to deploy migrations first, if it fails, use db push
  console.log('🔄 Attempting to deploy migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations deployed successfully');
  } catch (migrationError) {
    console.log('⚠️ Migration deployment failed, falling back to db push...');
    console.log('🔄 Running prisma db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Schema pushed successfully');
  }

  // Build Next.js app
  console.log('🏗️ Building Next.js app...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 