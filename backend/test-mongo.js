const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnection() {
  try {
    console.log('Testing connection to MongoDB via Prisma...');
    // Add a 5 second timeout
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000));
    
    await Promise.race([prisma.$connect(), timeout]);
    console.log('✅ Successfully connected to MongoDB Database!');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Number of users in database: ${userCount}`);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkConnection();
