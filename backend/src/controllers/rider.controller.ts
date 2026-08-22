import { Request, Response } from 'express';
import { prisma } from '../prisma';

// Helper to get Rider Profile by user ID
const getRiderProfileByUserId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { riderProfile: true }
  });
  return user?.riderProfile;
};

// 1. Toggle Rider Availability and City
export const toggleRiderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { isOnline, city } = req.body;

    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    const updatedProfile = await prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        isOnline: typeof isOnline === 'boolean' ? isOnline : riderProfile.isOnline,
        city: city !== undefined ? city : riderProfile.city
      }
    });

    res.json({
      success: true,
      message: `Rider availability dynamically updated to ${updatedProfile.isOnline ? 'ONLINE' : 'OFFLINE'}`,
      data: updatedProfile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Discover Available Deliveries (ACCEPTED, type DELIVERY, riderId === null)
export const getAvailableDeliveries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    // Find orders in status ACCEPTED, type DELIVERY, that have no rider assigned
    const orders = await prisma.order.findMany({
      where: {
        status: 'ACCEPTED',
        type: 'DELIVERY',
        riderId: null
      },
      include: {
        items: { include: { product: true } },
        vendor: { select: { id: true, storeName: true, address: true, logoUrl: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Claim/Assign Delivery to Rider
export const claimDelivery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params; // Order ID

    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    if (!riderProfile.isOnline) {
      return res.status(400).json({ success: false, message: 'Must go online to accept assignments' });
    }

    // Verify order exists, has status ACCEPTED, type DELIVERY, and hasn't been claimed yet
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.type !== 'DELIVERY') {
      return res.status(400).json({ success: false, message: 'This is not a delivery order' });
    }

    if (order.riderId) {
      return res.status(400).json({ success: false, message: 'Order has already been claimed by another rider' });
    }

    if (order.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Order is not in status accepting delivery setup.' });
    }

    // Assign order to rider
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { riderId: riderProfile.id },
      include: {
        items: { include: { product: true } },
        vendor: { select: { id: true, storeName: true, address: true } }
      }
    });

    res.json({
      success: true,
      message: 'Delivery claimed successfully',
      data: updatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Retrieve Active Assignment
export const getActiveDelivery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    // Retrieve active order in status ACCEPTED or IN_TRANSIT assigned to rider
    const activeOrder = await prisma.order.findFirst({
      where: {
        riderId: riderProfile.id,
        status: { in: ['ACCEPTED', 'IN_TRANSIT'] }
      },
      include: {
        items: { include: { product: true } },
        vendor: { select: { id: true, storeName: true, address: true, logoUrl: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });

    res.json({ success: true, data: activeOrder || null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Transit State
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params; // Order ID
    const { status } = req.body; // IN_TRANSIT or DELIVERED

    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.riderId !== riderProfile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized: You are not assigned to this order' });
    }

    if (!['IN_TRANSIT', 'DELIVERED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status update' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        vendor: { select: { id: true, storeName: true, address: true } }
      }
    });

    res.json({
      success: true,
      message: `Order status updated cleanly to ${status}`,
      data: updatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Retrieve Delivery History (DELIVERED only)
export const getDeliveryHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const riderProfile = await getRiderProfileByUserId(userId);
    if (!riderProfile) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const history = await prisma.order.findMany({
      where: {
        riderId: riderProfile.id,
        status: 'DELIVERED'
      },
      include: {
        items: true,
        vendor: { select: { id: true, storeName: true, address: true, logoUrl: true } },
        customer: { select: { firstName: true, lastName: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
