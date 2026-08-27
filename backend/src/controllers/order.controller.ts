import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.id || null;
    let userEmail = user?.email || req.body.guestEmail;

    if (userId && !userEmail) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (dbUser) userEmail = dbUser.email;
    }

    const { items, deliveryAddressId, deliveryAddress, guestEmail, guestName, guestPhone, type = 'DELIVERY' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Email is required for guest checkout' });
    }

    // 1. Fetch products from DB to ensure prices, inventory, and availability
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
      include: { vendor: { select: { id: true, storeName: true } } }
    });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more items in your cart are unavailable' });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // 2. Validate inventory & group items by vendor
    const itemsByVendor: Record<string, { product: any; quantity: number; price: number }[]> = {};

    const itemList = (items as any[]) || [];
    for (const item of itemList) {
      const p = productMap.get((item as any).productId);
      if (!p) continue;

      const qty = Math.max(1, parseInt((item as any).quantity) || 1);
      if (p.inventory > 0 && p.inventory < qty) {
        return res.status(400).json({ success: false, message: `Insufficient inventory for ${p.name}` });
      }

      const effectivePrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;

      if (!itemsByVendor[p.vendorId]) {
        itemsByVendor[p.vendorId] = [];
      }
      itemsByVendor[p.vendorId].push({ product: p, quantity: qty, price: effectivePrice });
    }

    // Resolve delivery address string
    let finalAddressString = '';
    if (deliveryAddressId && userId) {
      const addr = await prisma.customerAddress.findUnique({ where: { id: deliveryAddressId } });
      if (addr && addr.userId === userId) {
        finalAddressString = JSON.stringify({
          label: addr.label,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          country: addr.country
        });
      }
    } else if (deliveryAddress) {
      finalAddressString = typeof deliveryAddress === 'string' ? deliveryAddress : JSON.stringify(deliveryAddress);
    }

    let grandTotal = 0;
    const mainRef = `NM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const numVendors = Object.keys(itemsByVendor).length;
    
    for (const vendorId of Object.keys(itemsByVendor)) {
      const vendorItems: any = itemsByVendor[vendorId];
      const subtotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = type === 'DELIVERY' ? (1500 / numVendors) : 0;
      const platformFee = (500 / numVendors);
      grandTotal += subtotal + deliveryFee + platformFee;
    }

    const parentOrder = await prisma.parentOrder.create({
      data: {
        customerId: userId,
        guestEmail: !userId ? guestEmail : null,
        guestName: !userId ? guestName : null,
        guestPhone: !userId ? guestPhone : null,
        totalAmount: grandTotal,
        reference: mainRef,
        status: 'PENDING',
        payment: {
          create: {
            amount: grandTotal,
            reference: mainRef,
            status: 'PENDING'
          }
        }
      }
    });

    const createdOrders: any[] = [];

    // 3. Create Orders (one per vendor)
    for (const vendorId of Object.keys(itemsByVendor)) {
      const vendorItems: any = itemsByVendor[vendorId];
      const subtotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = type === 'DELIVERY' ? (1500 / numVendors) : 0;
      const platformFee = (500 / numVendors);
      const total = subtotal + deliveryFee + platformFee;

      const order = await prisma.order.create({
        data: {
          parentOrderId: parentOrder.id,
          customerId: userId,
          vendorId,
          subtotal,
          deliveryFee,
          platformFee,
          vendorEarnings: subtotal,
          riderEarnings: deliveryFee,
          total,
          status: 'PENDING_PAYMENT',
          type,
          deliveryAddress: finalAddressString,
          items: {
            create: vendorItems.map((i: any) => ({
              productId: i.product.id,
              quantity: i.quantity,
              price: i.price
            }))
          }
        },
        include: {
          items: { include: { product: true } },
          vendor: { select: { storeName: true } }
        }
      });

      createdOrders.push(order);
    }

    // 4. Initialize Paystack Transaction if Paystack Secret Key is configured
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const frontendUrl = process.env.FRONTEND_CUSTOMER_URL as string;
    let paystackAuthUrl = '';

    if (paystackSecret && !paystackSecret.includes('placeholder')) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(grandTotal * 100), // in Kobo
            reference: mainRef,
            callback_url: `${frontendUrl}/checkout/success?reference=${mainRef}&orderId=${createdOrders[0].id}`,
            metadata: {
              customerId: userId,
              orderIds: createdOrders.map(o => o.id)
            }
          })
        });

        const paystackData = await response.json();
        if (paystackData.status && paystackData.data?.authorization_url) {
          paystackAuthUrl = paystackData.data.authorization_url;
        }
      } catch (e: any) {
        console.error('Paystack initialization error:', e.message);
      }
    }

    // Fallback if Paystack integration is in test/mock mode
    if (!paystackAuthUrl) {
      paystackAuthUrl = `${frontendUrl}/checkout/success?reference=${mainRef}&orderId=${createdOrders[0].id}&mock=true`;
    }

    res.status(201).json({
      success: true,
      data: {
        orders: createdOrders,
        grandTotal,
        reference: mainRef,
        paystackUrl: paystackAuthUrl
      }
    });

  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: { include: { product: true } },
          vendor: { select: { id: true, storeName: true, logoUrl: true } },
          rider: { select: { id: true, vehicleType: true } },
          parentOrder: { include: { payment: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { customerId: userId } })
    ]);

    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        vendor: { select: { id: true, storeName: true, logoUrl: true, address: true } },
        payment: true,
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customerId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
