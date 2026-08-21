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

    let payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference: reference },
          { reference: { startsWith: reference } }
        ]
      },
      include: { order: { include: { items: { include: { product: true } }, vendor: true } } }
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
        orderId: payment?.orderId,
        order: payment?.order
      }
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function processSuccessfulPayment(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { reference: reference },
        { reference: { startsWith: reference } }
      ]
    },
    include: { order: { include: { items: true } } }
  });

  if (!payment) return null;

  if (payment.status !== 'SUCCESS') {
    // Update Payment status to SUCCESS
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS' },
      include: { order: { include: { items: { include: { product: true } }, vendor: true } } }
    });

    // Update Order status to PENDING (awaiting vendor processing)
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PENDING' }
    });

    // Decrement stock inventory for ordered products
    for (const item of payment.order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { inventory: { decrement: item.quantity } }
      });
    }

    return updatedPayment;
  }

  return payment;
}
