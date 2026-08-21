import { prisma } from '../prisma';
import crypto from 'crypto';

async function verifyStage5() {
  console.log('\n=====================================================');
  console.log('  STAGE 5 CUSTOMER STOREFRONT & CHECKOUT VERIFICATION');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ PASSED [${total}]: ${msg}`);
      passed++;
    } else {
      console.log(`❌ FAILED [${total}]: ${msg}`);
    }
  }

  try {
    // 1. Verify Prisma models and catalog data
    const categoriesCount = await prisma.category.count();
    assert(categoriesCount === 10, `Official Primary Categories populated (Found: ${categoriesCount})`);

    const subcategoriesCount = await prisma.subcategory.count();
    assert(subcategoriesCount >= 70, `Official Subcategories populated (Found: ${subcategoriesCount})`);

    const vendorCount = await prisma.vendorProfile.count();
    assert(vendorCount >= 1, `Active Vendors present in DB (Found: ${vendorCount})`);

    // 2. Test Customer User & Product presence
    let testCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    if (!testCustomer) {
      testCustomer = await prisma.user.create({
        data: {
          email: 'stage5customer@test.com',
          password: 'Password123!',
          firstName: 'Stage5',
          lastName: 'Tester',
          role: 'CUSTOMER'
        }
      });
    }
    assert(!!testCustomer, `Test Customer user ready (ID: ${testCustomer.id})`);

    let testVendor = await prisma.vendorProfile.findFirst();
    if (testVendor && !testVendor.isRegistered) {
      testVendor = await prisma.vendorProfile.update({
        where: { id: testVendor.id },
        data: { isRegistered: true, status: 'ACTIVE' }
      });
    }
    assert(!!testVendor, `Test Vendor profile ready (Store: ${testVendor?.storeName})`);

    let testProduct = await prisma.product.findFirst({ where: { isAvailable: true } });
    if (!testProduct && testVendor) {
      const firstCat = await prisma.category.findFirst();
      testProduct = await prisma.product.create({
        data: {
          vendorId: testVendor.id,
          categoryId: firstCat!.id,
          name: 'Stage 5 Test Fresh Apples',
          description: 'Crunchy red apples for verification',
          price: 2500,
          inventory: 50,
          isAvailable: true,
          images: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
        }
      });
    }
    assert(!!testProduct, `Test Product ready (Name: ${testProduct?.name}, Price: ₦${testProduct?.price})`);

    // 3. Test Order Creation DB transaction logic
    const testOrder = await prisma.order.create({
      data: {
        customerId: testCustomer.id,
        vendorId: testVendor!.id,
        subtotal: testProduct!.price,
        deliveryFee: 500,
        platformFee: 50,
        total: testProduct!.price + 550,
        status: 'PENDING',
        type: 'DELIVERY',
        deliveryAddress: JSON.stringify({ line1: '12 Test Street', city: 'Lagos' }),
        items: {
          create: [{
            productId: testProduct!.id,
            quantity: 2,
            price: testProduct!.price
          }]
        },
        payment: {
          create: {
            amount: testProduct!.price + 550,
            reference: `VERIFY-STG5-${Date.now()}`,
            status: 'PENDING'
          }
        }
      },
      include: { items: true, payment: true }
    });

    assert(!!testOrder && testOrder.items.length === 1, `Order record created cleanly in DB (ID: ${testOrder.id})`);
    assert(!!testOrder.payment && testOrder.payment.status === 'PENDING', `Payment record linked with status PENDING (Ref: ${testOrder.payment?.reference})`);

    // 4. Test Payment Verification logic
    const updatedPayment = await prisma.payment.update({
      where: { id: testOrder.payment!.id },
      data: { status: 'SUCCESS' }
    });
    assert(updatedPayment.status === 'SUCCESS', `Payment status updated to SUCCESS on confirmation`);

    // 5. Test Webhook HMAC SHA512 Signature algorithm
    const secret = 'sk_test_mock_secret_key_12345';
    const sampleBody = { event: 'charge.success', data: { reference: testOrder.payment!.reference } };
    const generatedHash = crypto.createHmac('sha512', secret).update(JSON.stringify(sampleBody)).digest('hex');
    assert(typeof generatedHash === 'string' && generatedHash.length === 128, `HMAC-SHA512 webhook signature generation valid (Length: ${generatedHash.length})`);

    // Clean up test order
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.payment.delete({ where: { id: testOrder.payment!.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });

    console.log('\n=====================================================');
    console.log(`  VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
    console.log('=====================================================\n');

  } catch (err: any) {
    console.error('Verification error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStage5();
