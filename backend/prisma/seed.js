const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB seed...');

  // Clear existing
  await prisma.dispute.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('demo123', 10);

  // Farmers
  const farmerUser1 = await prisma.user.create({
    data: { name: 'Ramesh Kumar', phone: '9876543210', email: 'farmer@farmora.demo', password, role: 'FARMER', location: 'Hyderabad' }
  });
  const farmerProfile1 = await prisma.farmerProfile.create({ data: { userId: farmerUser1.id } });
  const farmer1 = { ...farmerUser1, farmerProfile: farmerProfile1 };

  const farmerUser2 = await prisma.user.create({
    data: { name: 'Warangal Producer Group', phone: '9876543211', email: 'farmer2@farmora.demo', password, role: 'FARMER', location: 'Warangal' }
  });
  const farmerProfile2 = await prisma.farmerProfile.create({ data: { userId: farmerUser2.id } });
  const farmer2 = { ...farmerUser2, farmerProfile: farmerProfile2 };

  // Buyers
  const buyerUser1 = await prisma.user.create({
    data: { name: 'ABC Foods Pvt Ltd', phone: '9876543220', email: 'buyer@farmora.demo', password, role: 'BUYER', location: 'Hyderabad' }
  });
  const buyerProfile1 = await prisma.buyerProfile.create({ data: { userId: buyerUser1.id, isVerified: true, trustScore: 95 } });
  const buyer1 = { ...buyerUser1, buyerProfile: buyerProfile1 };

  const buyerUser2 = await prisma.user.create({
    data: { name: 'FreshMart Retail', phone: '9876543221', email: 'buyer2@farmora.demo', password, role: 'BUYER', location: 'Secunderabad' }
  });
  const buyerProfile2 = await prisma.buyerProfile.create({ data: { userId: buyerUser2.id, isVerified: true, trustScore: 91 } });
  const buyer2 = { ...buyerUser2, buyerProfile: buyerProfile2 };

  // Admin
  await prisma.user.create({
    data: { name: 'System Admin', phone: '9876543230', email: 'admin@farmora.demo', password, role: 'ADMIN', location: 'HQ' }
  });

  // Lots
  const lot1 = await prisma.lot.create({
    data: { lotNumber: 'LOT-KL-1024', crop: 'Tomato', quantity: 1000, grade: 'A', expectedPrice: 32, location: 'Hyderabad',
      harvestDate: new Date('2026-09-02'), status: 'AVAILABLE', farmerProfileId: farmer1.farmerProfile.id }
  });

  const lot2 = await prisma.lot.create({
    data: { lotNumber: 'LOT-KL-1021', crop: 'Chilli', quantity: 700, grade: 'A', expectedPrice: 118, location: 'Warangal',
      harvestDate: new Date('2026-08-31'), status: 'AVAILABLE', farmerProfileId: farmer2.farmerProfile.id }
  });

  // Requirements
  await prisma.requirement.create({
    data: { crop: 'Tomato', quantity: 5000, grade: 'A', maxPrice: 35, location: 'Hyderabad', paymentTerms: '3 days', buyerProfileId: buyer1.buyerProfile.id }
  });

  // Offers
  const offer1 = await prisma.offer.create({
    data: { lotId: lot1.id, buyerProfileId: buyer1.buyerProfile.id, price: 34, quantity: 500, paymentTerms: '3 days', matchScore: 94 }
  });

  const offer2 = await prisma.offer.create({
    data: { lotId: lot1.id, buyerProfileId: buyer2.buyerProfile.id, price: 33, quantity: 700, paymentTerms: '2 days', matchScore: 87 }
  });

  // Transactions
  await prisma.transaction.create({
    data: { txNumber: 'TX-2018', lotId: lot2.id, offerId: offer1.id, quantity: 300, totalAmount: 35400, status: 'DELIVERED', paymentStatus: 'PAID', step: 4 }
  });

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
