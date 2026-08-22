import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];

    if (paystackSecret && signature) {
      const hash = crypto
        .createHmac('sha512', paystackSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const reference = event.data?.reference;
      if (reference) {
        await processSuccessfulPayment(reference);
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    let payment = await prisma.payment.findUnique({
      where: { reference },
      include: { parentOrder: { include: { orders: { include: { items: { include: { product: true } }, vendor: true } } } } }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // If still PENDING, verify directly with Paystack API if key is available
    if (payment.status === 'PENDING') {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecret && !paystackSecret.includes('placeholder')) {
        try {
          const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` }
          });
          const result = await response.json();
          if (result.status && result.data?.status === 'success') {
            payment = await processSuccessfulPayment(payment.reference);
          }
        } catch (e: any) {
          console.error('Paystack manual verification error:', e.message);
        }
      } else {
        // If mock parameter or development mode, auto-confirm payment
        payment = await processSuccessfulPayment(payment.reference);
      }
    }

    res.json({
      success: true,
      data: {
        paymentStatus: payment?.status,
        orderId: payment?.parentOrder?.id || payment?.orderId, // Fallback for old orders
        parentOrder: payment?.parentOrder
      }
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function processSuccessfulPayment(reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { parentOrder: { include: { orders: { include: { items: true } } } } }
  });

  if (!payment) return null;

  if (payment.status !== 'SUCCESS') {
    // Update Payment status to SUCCESS
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS' },
      include: { parentOrder: { include: { orders: { include: { items: { include: { product: true } }, vendor: true } } } } }
    });

    if (payment.parentOrderId && payment.parentOrder) {
      // Update ParentOrder status
      await prisma.parentOrder.update({
        where: { id: payment.parentOrderId },
        data: { status: 'SUCCESS' }
      });

      // Update ALL child Order statuses to PAID
      for (const order of payment.parentOrder.orders) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID' }
        });

        // Decrement stock inventory for ordered products
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { inventory: { decrement: item.quantity } }
          });
        }
      }
    }

    return updatedPayment;
  }

  return payment;
}
