const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  role: z.enum(['FARMER', 'BUYER', 'ADMIN']),
  location: z.string().optional()
});

const loginSchema = z.object({
  identifier: z.string(), // phone or email
  password: z.string()
});

exports.register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, phone, email, password, role, location } = validatedData;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: email || undefined }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'An account with this phone number already exists.' } });
      }
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'An account with this email already exists.' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role,
        location
      }
    });

    if (role === 'FARMER') {
      await prisma.farmerProfile.create({ data: { userId: user.id } });
    } else if (role === 'BUYER') {
      await prisma.buyerProfile.create({ data: { userId: user.id, trustScore: 80 } });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, role: user.role, location: user.location }
      },
      message: 'Registration successful'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, role: user.role, location: user.location }
      },
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    }
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone: true, email: true, role: true, location: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    res.json({
      success: true,
      data: { user },
      message: 'Profile retrieved'
    });
  } catch (error) {
    next(error);
  }
};
