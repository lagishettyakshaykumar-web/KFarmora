const prisma = require('../utils/db');

exports.getTransactions = async (req, res, next) => {
  try {
    let transactions = [];
    
    if (req.user.role === 'FARMER') {
      const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: req.user.id } });
      if (farmerProfile) {
        transactions = await prisma.transaction.findMany({
          where: { lot: { farmerProfileId: farmerProfile.id } },
          include: { 
            lot: true, 
            offer: { include: { buyerProfile: { include: { user: { select: { name: true } } } } } } 
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (req.user.role === 'BUYER') {
      const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: req.user.id } });
      if (buyerProfile) {
        transactions = await prisma.transaction.findMany({
          where: { offer: { buyerProfileId: buyerProfile.id } },
          include: { 
            lot: { include: { farmerProfile: { include: { user: { select: { name: true } } } } } },
            offer: true
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (req.user.role === 'ADMIN') {
      transactions = await prisma.transaction.findMany({
        include: { 
          lot: true,
          offer: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({
      success: true,
      data: { transactions },
      message: 'Transactions retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.advanceTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tx = await prisma.transaction.findUnique({ where: { id } });

    if (!tx) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
    }

    // Example sequence: CONFIRMED(1) -> PICKUP_SCHEDULED(2) -> IN_TRANSIT(3) -> DELIVERED(4) -> COMPLETED(5)
    let nextStep = tx.step + 1;
    let nextStatus = tx.status;
    let paymentStatus = tx.paymentStatus;

    if (tx.step === 1) nextStatus = 'PICKUP_SCHEDULED';
    if (tx.step === 2) nextStatus = 'IN_TRANSIT';
    if (tx.step === 3) nextStatus = 'DELIVERED';
    if (tx.step === 4) {
      nextStatus = 'COMPLETED';
      paymentStatus = 'PAID';
    }

    if (nextStep > 5) {
       return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Transaction already completed' } });
    }

    const updatedTx = await prisma.transaction.update({
      where: { id },
      data: {
        step: nextStep,
        status: nextStatus,
        paymentStatus
      }
    });

    res.json({
      success: true,
      data: { transaction: updatedTx },
      message: 'Transaction advanced successfully'
    });
  } catch (error) {
    next(error);
  }
};
