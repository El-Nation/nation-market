import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { sendNationMarketEmail } from '../utils/mailer';

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
    const reference = req.params.reference as string;

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
        orderId: (payment as any)?.parentOrder?.id || payment?.orderId, // Fallback for old orders
        parentOrder: (payment as any)?.parentOrder
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
      include: { parentOrder: { include: { customer: true, orders: { include: { items: { include: { product: true } }, vendor: true } } } } }
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

    try {
      const parentOrder = (updatedPayment as any).parentOrder;
      const userEmail = parentOrder?.guestEmail || parentOrder?.customer?.email;
      if (userEmail) {
        const frontendUrl = process.env.FRONTEND_CUSTOMER_URL || process.env.FRONTEND_VENDOR_URL as string;
        
        const vendorBlocksHtml = parentOrder?.orders.map((vendorOrder: any) => {
          let itemsHtml = vendorOrder.items.map((item: any) => {
            const productImg = item.product?.images 
               ? item.product.images.split(',')[0].includes('cloudinary') 
                    ? item.product.images.split(',')[0].replace('/upload/', '/upload/w_60,h_60,c_fill,q_auto/') 
                    : item.product.images.split(',')[0]
               : null;
            
            const imgHtml = productImg 
               ? `<img src="${productImg}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; background: #e5e7eb;" alt="" />`
               : `<div style="width: 40px; height: 40px; border-radius: 6px; background: #f3f4f6; text-align: center; line-height: 40px; font-size: 18px; border: 1px solid #e5e7eb; display: inline-block;">📦</div>`;

            return `
            <div style="display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f9fafb; font-size: 14.5px; color: #4b5563;">
              <div style="display: flex; gap: 12px;">
                ${imgHtml}
                <div style="margin-top: 2px;">
                  <span style="font-weight: 600;">${item.quantity}×</span> ${item.product?.name || 'Product'}
                </div>
              </div>
              <div style="font-weight: 600; margin-top: 2px;">₦${(item.price * item.quantity).toLocaleString()}</div>
            </div>
          `}).join('');

          return `
            <div style="margin-top: 24px; border: 1px solid #f3f4f6; border-radius: 10px; overflow: hidden;">
              <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #374151; display: flex; justify-content: space-between;">
                <span>${vendorOrder.vendor?.storeName || 'Vendor Store'}</span>
                <span style="font-size: 13px; font-weight: 500; color: #6b7280;">#${vendorOrder.id.slice(0,8).toUpperCase()}</span>
              </div>
              ${itemsHtml}
              <div style="padding: 12px 16px; background: #fafaf9; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 14px;">
                <span style="color: #6b7280;">Vendor Subtotal (inc. fees)</span>
                <span style="color: #111827; font-weight: 600;">₦${vendorOrder.total?.toLocaleString()}</span>
              </div>
            </div>
          `;
        }).join('');
        
        const customerName = parentOrder?.guestName || parentOrder?.customer?.firstName || 'Customer';

        const emailHtml = `
          <div style="max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <div style="background: #111827; padding: 24px; color: #fff; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Digital Receipt</h1>
              <p style="margin: 6px 0 0; color: #9ca3af; font-size: 14px;">Nation Market Transaction</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 15.5px; color: #111827;">Hello <strong>${customerName}</strong>, your payment was confirmed!</p>
              <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14.5px;">
                  <span style="color: #6b7280;">Date</span>
                  <span style="color: #111827; font-weight: 600;">${new Date(updatedPayment.createdAt).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14.5px;">
                  <span style="color: #6b7280;">Transaction Ref</span>
                  <span style="color: #111827; font-weight: 600; font-family: monospace;">${updatedPayment.reference}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14.5px;">
                  <span style="color: #6b7280;">Billed To</span>
                  <span style="color: #111827; font-weight: 600; text-align: right;">${customerName}<br/><span style="font-size: 13px; font-weight: 400; color: #6b7280;">${userEmail}</span></span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14.5px;">
                  <span style="color: #6b7280;">Status</span>
                  <span style="color: #10b981; background: #ecfdf5; padding: 2px 10px; border-radius: 4px; font-weight: 600;">PAID</span>
                </div>
              </div>

              ${vendorBlocksHtml}

              <div style="margin-top: 24px; padding-top: 24px; border-top: 2px dashed #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; color: #111827;">
                  <span>Total Paid</span>
                  <span>₦${updatedPayment.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; margin-bottom: 32px; font-size: 13.5px; color: #6b7280; line-height: 1.6;">
            <p style="margin: 0 0 4px; font-weight: 600; color: #374151;">NATION MARKET © ${new Date().getFullYear()}</p>
            <p style="margin: 0;">This receipt is dynamically generated and securely signed.<br/>All rights reserved.</p>
          </div>
        `;

        await sendNationMarketEmail(userEmail, 'Order & Payment Receipt', 'Payment Confirmed! ✅', emailHtml);
      }
    } catch (err: any) {
      console.error('Failed to dispatch receipt email:', err.message);
    }

    return updatedPayment;
  }

  return payment;
}
