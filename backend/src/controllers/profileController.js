const prisma = require('../utils/db');
const { z } = require('zod');

// ─── Validation schemas ───────────────────────────────────────
const commonProfileSchema = z.object({
  name: z.string().min(2).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().max(10).optional(),
  profilePhotoUrl: z.string().optional(),
  accountStatus: z.enum(['Active', 'Inactive']).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const farmerProfileSchema = z.object({
  farmName: z.string().optional(),
  farmLocation: z.string().optional(),
  landArea: z.number().positive().optional(),
  landAreaUnit: z.enum(['Acres', 'Hectares']).optional(),
  primaryCrops: z.string().optional(),
  secondaryCrops: z.string().optional(),
  farmingType: z.enum(['Organic', 'Conventional', 'Mixed']).optional(),
  irrigationType: z.enum(['Rainfed', 'Borewell', 'Canal', 'Drip', 'Other']).optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  farmerId: z.string().optional(),
  fpo: z.string().optional(),
  storageAvailability: z.boolean().optional(),
  preferredMarkets: z.string().optional(),
  preferredSellingMethod: z.string().optional(),
});

const buyerProfileSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.enum(['Wholesaler', 'Retailer', 'Processor', 'Exporter', 'Institutional Buyer', 'Other']).optional(),
  buyerId: z.string().optional(),
  registrationNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  businessAddress: z.string().optional(),
  procurementLocation: z.string().optional(),
  cropsInterestedIn: z.string().optional(),
  requiredQuantity: z.number().positive().optional(),
  quantityUnit: z.string().optional(),
  preferredQualityGrade: z.string().optional(),
  preferredMarkets: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  preferredDeliveryLocation: z.string().optional(),
});

const managerProfileSchema = z.object({
  managerId: z.string().optional(),
  organization: z.string().optional(),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
  officeLocation: z.string().optional(),
  dateOfJoining: z.string().optional(),
  areaOfResponsibility: z.string().optional(),
  assignedRegion: z.string().optional(),
  assignedDistricts: z.string().optional(),
  managedFarmers: z.number().int().nonnegative().optional(),
  managedBuyers: z.number().int().nonnegative().optional(),
  permissionLevel: z.enum(['Viewer', 'Coordinator', 'Manager', 'Administrator']).optional(),
});

// ─── GET /api/v1/profile ─────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true, email: true, role: true,
        location: true, gender: true, dateOfBirth: true, address: true,
        city: true, state: true, pincode: true, profilePhotoUrl: true,
        accountStatus: true, createdAt: true,
        farmerProfile: true,
        buyerProfile: {
          select: {
            id: true, isVerified: true, trustScore: true,
            businessName: true, businessType: true, buyerId: true,
            registrationNumber: true, gstNumber: true, businessAddress: true,
            procurementLocation: true, cropsInterestedIn: true,
            requiredQuantity: true, quantityUnit: true,
            preferredQualityGrade: true, preferredMarkets: true,
            minPrice: true, maxPrice: true, preferredDeliveryLocation: true,
          }
        },
        managerProfile: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    res.json({ success: true, data: { profile: user }, message: 'Profile retrieved' });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/v1/profile ─────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const role = req.user.role;
    const body = req.body;

    // Validate common fields
    const commonData = commonProfileSchema.parse({
      name: body.name,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      profilePhotoUrl: body.profilePhotoUrl,
      accountStatus: body.accountStatus,
      phone: body.phone,
      email: body.email,
    });

    // Build user update payload (remove undefined fields)
    const userUpdate = {};
    Object.entries(commonData).forEach(([k, v]) => { if (v !== undefined) userUpdate[k] = v; });
    if (userUpdate.dateOfBirth) userUpdate.dateOfBirth = new Date(userUpdate.dateOfBirth);

    // Update User record
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: req.user.id }, data: userUpdate });
    }

    // Update role-specific profile
    if (role === 'FARMER') {
      const farmerData = farmerProfileSchema.parse(body.farmerProfile || {});
      const farmerUpdate = {};
      Object.entries(farmerData).forEach(([k, v]) => { if (v !== undefined) farmerUpdate[k] = v; });
      if (Object.keys(farmerUpdate).length > 0) {
        await prisma.farmerProfile.upsert({
          where: { userId: req.user.id },
          update: farmerUpdate,
          create: { userId: req.user.id, ...farmerUpdate }
        });
      }
    } else if (role === 'BUYER') {
      const buyerData = buyerProfileSchema.parse(body.buyerProfile || {});
      const buyerUpdate = {};
      Object.entries(buyerData).forEach(([k, v]) => { if (v !== undefined) buyerUpdate[k] = v; });
      if (Object.keys(buyerUpdate).length > 0) {
        await prisma.buyerProfile.upsert({
          where: { userId: req.user.id },
          update: buyerUpdate,
          create: { userId: req.user.id, ...buyerUpdate }
        });
      }
    } else if (role === 'ADMIN') {
      const managerData = managerProfileSchema.parse(body.managerProfile || {});
      const managerUpdate = {};
      Object.entries(managerData).forEach(([k, v]) => { if (v !== undefined) managerUpdate[k] = v; });
      if (managerUpdate.dateOfJoining) managerUpdate.dateOfJoining = new Date(managerUpdate.dateOfJoining);
      if (Object.keys(managerUpdate).length > 0) {
        await prisma.managerProfile.upsert({
          where: { userId: req.user.id },
          update: managerUpdate,
          create: { userId: req.user.id, ...managerUpdate }
        });
      }
    }

    // Re-fetch updated profile
    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true, email: true, role: true,
        location: true, gender: true, dateOfBirth: true, address: true,
        city: true, state: true, pincode: true, profilePhotoUrl: true,
        accountStatus: true, createdAt: true,
        farmerProfile: true,
        buyerProfile: {
          select: {
            id: true, isVerified: true, trustScore: true,
            businessName: true, businessType: true, buyerId: true,
            registrationNumber: true, gstNumber: true, businessAddress: true,
            procurementLocation: true, cropsInterestedIn: true,
            requiredQuantity: true, quantityUnit: true,
            preferredQualityGrade: true, preferredMarkets: true,
            minPrice: true, maxPrice: true, preferredDeliveryLocation: true,
          }
        },
        managerProfile: true,
      }
    });

    res.json({ success: true, data: { profile: updated }, message: 'Profile updated successfully' });
  } catch (error) {
    if (error.constructor.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    }
    next(error);
  }
};
