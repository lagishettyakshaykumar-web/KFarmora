const prisma = require('../utils/db');
const { z } = require('zod');

const offerSchema = z.object({
  lotId: z.string(),
  price: z.number().positive(),
  quantity: z.number().positive(),
  paymentTerms: z.string(),
  message: z.string().optional()
});

exports.createOffer = async (req, res, next) => {
  try {
    const validatedData = offerSchema.parse(req.body);

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyerProfile) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only buyers can make offers' } });
    }

    const lot = await prisma.lot.findUnique({ where: { id: validatedData.lotId } });
    if (!lot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lot not found' } });
    }

    // Basic match score simulation for demo
    const matchScore = Math.floor(Math.random() * (99 - 70) + 70);

    const offer = await prisma.offer.create({
      data: {
        ...validatedData,
        buyerProfileId: buyerProfile.id,
        matchScore
      }
    });

    res.status(201).json({
      success: true,
      data: { offer },
      message: 'Offer submitted successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    }
    next(error);
  }
};

exports.getOffers = async (req, res, next) => {
  try {
    let offers = [];
    if (req.user.role === 'FARMER') {
      const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: req.user.id } });
      if(farmerProfile) {
        offers = await prisma.offer.findMany({
          where: { lot: { farmerProfileId: farmerProfile.id } },
          include: { lot: true, buyerProfile: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (req.user.role === 'BUYER') {
      const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: req.user.id } });
      if(buyerProfile) {
        offers = await prisma.offer.findMany({
          where: { buyerProfileId: buyerProfile.id },
          include: { lot: true },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    res.json({
      success: true,
      data: { offers },
      message: 'Offers retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { lot: true }
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } });
    }

    // Ensure farmer owns the lot
    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: req.user.id } });
    if (!farmerProfile || offer.lot.farmerProfileId !== farmerProfile.id) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to accept this offer' } });
    }

    // Sequential execution instead of transaction for MongoDB without Replica Set
    // Update offer status
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' }
    });

    // Update lot status
    await prisma.lot.update({
      where: { id: offer.lotId },
      data: { status: 'RESERVED' }
    });

    // Close other offers for this lot
    await prisma.offer.updateMany({
      where: { lotId: offer.lotId, id: { not: offerId } },
      data: { status: 'REJECTED' }
    });

    // Create transaction
    const txNumber = `TX-${Math.floor(2000 + Math.random() * 8000)}`;
    const transaction = await prisma.transaction.create({
      data: {
        txNumber,
        lotId: offer.lotId,
        offerId: offer.id,
        quantity: offer.quantity,
        totalAmount: offer.quantity * offer.price
      }
    });

    res.json({
      success: true,
      data: { transaction },
      message: 'Offer accepted and transaction created'
    });
  } catch (error) {
    next(error);
  }
};
