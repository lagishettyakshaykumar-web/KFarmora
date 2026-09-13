const prisma = require('../utils/db');
const { z } = require('zod');

const lotSchema = z.object({
  crop: z.string(),
  quantity: z.number().positive(),
  grade: z.string(),
  expectedPrice: z.number().positive(),
  location: z.string(),
  harvestDate: z.string(),
  qualityNotes: z.string().optional(),
  // AI verification fields (optional, provided after AI check)
  cropImageUrl: z.string().optional(),
  aiVerifiedGrade: z.string().optional(),
  aiConfidence: z.number().int().min(0).max(100).optional(),
  cropDetected: z.string().optional(),
  cropMatches: z.boolean().optional(),
  gradeMatches: z.boolean().optional(),
  aiQualityIndicators: z.string().optional(), // JSON string
  aiReason: z.string().optional(),
  verificationStatus: z.string().optional(), // VERIFIED, NEEDS_REVIEW, UNVERIFIED, GRADE_MISMATCH, CROP_MISMATCH
  verificationTimestamp: z.string().optional(),
});

exports.createLot = async (req, res, next) => {
  try {
    const validatedData = lotSchema.parse(req.body);

    // Check if user is a farmer
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!farmerProfile) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only farmers can create lots' } });
    }

    const lotNumber = `LOT-KL-${Math.floor(1000 + Math.random() * 9000)}`;

    const lot = await prisma.lot.create({
      data: {
        crop: validatedData.crop,
        quantity: validatedData.quantity,
        grade: validatedData.grade,
        expectedPrice: validatedData.expectedPrice,
        location: validatedData.location,
        harvestDate: new Date(validatedData.harvestDate),
        qualityNotes: validatedData.qualityNotes,
        lotNumber,
        farmerProfileId: farmerProfile.id,
        // AI verification fields
        cropImageUrl: validatedData.cropImageUrl,
        aiVerifiedGrade: validatedData.aiVerifiedGrade,
        aiConfidence: validatedData.aiConfidence,
        cropDetected: validatedData.cropDetected,
        cropMatches: validatedData.cropMatches,
        gradeMatches: validatedData.gradeMatches,
        aiQualityIndicators: validatedData.aiQualityIndicators,
        aiReason: validatedData.aiReason,
        verificationStatus: validatedData.verificationStatus,
        verificationTimestamp: validatedData.verificationTimestamp ? new Date(validatedData.verificationTimestamp) : null,
      }
    });

    res.status(201).json({
      success: true,
      data: { lot },
      message: 'Lot created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    }
    next(error);
  }
};

exports.getLots = async (req, res, next) => {
  try {
    const { crop, location, status } = req.query;

    const where = {};
    if (crop) where.crop = crop;
    if (location) where.location = location;
    if (status) where.status = status;

    const lots = await prisma.lot.findMany({
      where,
      include: {
        farmerProfile: {
          include: { user: { select: { name: true, location: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { lots },
      message: 'Lots retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getLotById = async (req, res, next) => {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: req.params.id },
      include: {
        farmerProfile: {
          include: { user: { select: { name: true, location: true } } }
        },
        offers: {
          include: {
            buyerProfile: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      }
    });

    if (!lot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lot not found' } });
    }

    res.json({
      success: true,
      data: { lot },
      message: 'Lot retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};
