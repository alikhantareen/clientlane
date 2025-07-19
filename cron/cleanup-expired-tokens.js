const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting cleanup of expired password reset tokens...');
    
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    });
    
    console.log(`✅ Cleaned up ${result.count} expired/used password reset tokens`);
    
    // Also clean up expired OTPs
    const otpResult = await prisma.oTP.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    
    console.log(`✅ Cleaned up ${otpResult.count} expired OTPs`);
    
    return {
      passwordResetTokens: result.count,
      otps: otpResult.count,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupExpiredTokens()
    .then(result => {
      console.log('🎉 Cleanup completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupExpiredTokens }; 