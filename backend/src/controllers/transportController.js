const prisma = require('../utils/db');

// ─── Mock demo shipment seed (inserted if not present) ──────────
const DEMO_SHIPMENT = {
  shipmentNumber: 'FG-TR-1024',
  buyerName: 'ABC Foods Pvt Ltd',
  buyerVerified: true,
  destination: 'ABC Foods Distribution Center, Hyderabad',
  godownName: 'Hyderabad Central Godown',
  godownCity: 'Hyderabad',
  vehicleNumber: 'TS09 AB 1234',
  driverName: 'Ravi Kumar',
  status: 'ARRIVED_AT_GODOWN',
  totalQuantity: 800,
  expectedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
  items: {
    create: [
      {
        farmerName: 'Akshay Kumar',
        farmerLocation: 'Hyderabad',
        crop: 'Tomato',
        quantity: 500,
        pickupPoint: 'Hyderabad Farm Gate',
        status: 'IN_TRANSIT',
      },
      {
        farmerName: 'Ravi Kumar',
        farmerLocation: 'Warangal',
        crop: 'Chilli',
        quantity: 300,
        pickupPoint: 'Warangal Collection Point',
        status: 'IN_TRANSIT',
      }
    ]
  }
};

async function ensureDemoShipment() {
  try {
    const existing = await prisma.shipment.findUnique({
      where: { shipmentNumber: 'FG-TR-1024' }
    });
    if (!existing) {
      await prisma.shipment.create({ data: DEMO_SHIPMENT });
    }
  } catch (e) {
    // Non-fatal — demo data seeding failure should not crash the app
    console.warn('Transport demo seed failed:', e.message);
  }
}

// Status → progress percentage mapping
const STATUS_PROGRESS = {
  PICKUP_SCHEDULED: 10,
  PICKUP_ASSIGNED: 20,
  PRODUCE_COLLECTED: 35,
  IN_TRANSIT_TO_GODOWN: 50,
  ARRIVED_AT_GODOWN: 65,
  QUALITY_VERIFICATION: 75,
  CONSOLIDATED: 82,
  DISPATCHED_TO_BUYER: 92,
  OUT_FOR_DELIVERY: 96,
  DELIVERED: 100,
};

// Status → human label
const STATUS_LABELS = {
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKUP_ASSIGNED: 'Pickup Assigned',
  PRODUCE_COLLECTED: 'Produce Collected',
  IN_TRANSIT_TO_GODOWN: 'In Transit to Godown',
  ARRIVED_AT_GODOWN: 'Arrived at Godown',
  QUALITY_VERIFICATION: 'Quality Verification',
  CONSOLIDATED: 'Consolidated',
  DISPATCHED_TO_BUYER: 'Dispatched to Buyer',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

// ─── GET /api/v1/transport ───────────────────────────────────────
exports.getShipments = async (req, res, next) => {
  try {
    await ensureDemoShipment();

    const shipments = await prisma.shipment.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = shipments.map(s => ({
      ...s,
      progress: STATUS_PROGRESS[s.status] ?? 0,
      statusLabel: STATUS_LABELS[s.status] ?? s.status,
    }));

    res.json({ success: true, data: { shipments: enriched }, message: 'Shipments retrieved' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/transport/:id ──────────────────────────────────
exports.getShipmentById = async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { lot: true } } }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    res.json({
      success: true,
      data: {
        shipment: {
          ...shipment,
          progress: STATUS_PROGRESS[shipment.status] ?? 0,
          statusLabel: STATUS_LABELS[shipment.status] ?? shipment.status,
        }
      },
      message: 'Shipment retrieved'
    });
  } catch (error) {
    next(error);
  }
};
