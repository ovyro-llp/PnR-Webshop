/**
 * scripts/verify-checkout-filtering.js
 * Verification suite for:
 * 1. Filtering out AWAITING_PAYMENT orders from Orders & Dispatch
 * 2. Routing abandoned checkouts to Analytics & Reporting with WhatsApp recovery
 * 3. Rejecting Cash on Delivery (COD) across the platform
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runCheckoutFilteringTests() {
  console.log('=================================================================');
  console.log('🧪 CHECKOUT FILTERING, ABANDONMENT & COD REMOVAL VERIFICATION');
  console.log('=================================================================\n');

  try {
    // Explicitly activate Sandbox Test Mode for integration test suite
    await fetch(`${BASE_URL}/api/payments/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testMode: true }),
    });

    // TEST 1: Create an uncompleted checkout intent (AWAITING_PAYMENT)
    console.log('TEST 1: Creating an uncompleted checkout intent via Razorpay API...');
    const createRes = await fetch(`${BASE_URL}/api/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 350,
        subtotal: 310,
        deliveryFee: 40,
        outletSlug: 'cycle-circle',
        customer: {
          name: 'Rohan Patil',
          phone: '9822987654',
          address: 'Plot 42, Anand Nagar, Nashik',
          area: 'Gangapur Road',
          pincode: '422013',
          coordinates: { lat: 20.005, lng: 73.76 },
        },
        items: [
          { itemId: 'item-1', name: 'Butter Chicken Puff', price: 120, quantity: 2, total: 240 },
          { itemId: 'item-2', name: 'Dark Chocolate Pastry', price: 70, quantity: 1, total: 70 },
        ],
      }),
    });

    const draftData = await createRes.json();
    console.log('Create Order Response:', {
      status: createRes.status,
      success: draftData.success,
      orderId: draftData.orderId,
      internalOrderId: draftData.internalOrderId,
      orderNumber: draftData.orderNumber,
    });

    if (!draftData.success || !draftData.internalOrderId) {
      throw new Error(`Failed to create draft order intent: ${draftData.message}`);
    }
    console.log('✅ TEST 1 PASSED: Draft checkout order created successfully.\n');

    // TEST 2: Verify Orders & Dispatch default filtering (Must exclude AWAITING_PAYMENT)
    console.log('TEST 2: Verifying Orders & Dispatch query (/api/orders/list) excludes AWAITING_PAYMENT...');
    const listRes = await fetch(`${BASE_URL}/api/orders/list`);
    const listData = await listRes.json();

    if (!listData.success) {
      throw new Error(`Failed to fetch orders list: ${listData.message}`);
    }

    const isDraftInDefaultList = listData.orders.some(
      (o) => o.id === draftData.internalOrderId || o.orderNumber === draftData.orderNumber
    );

    if (isDraftInDefaultList) {
      throw new Error('FAIL: Draft AWAITING_PAYMENT order appeared in standard Orders & Dispatch list!');
    }
    console.log(`Default Orders List count: ${listData.orders.length} (Draft order successfully excluded)`);

    // Verify that querying status=AWAITING_PAYMENT returns the draft
    const draftListRes = await fetch(`${BASE_URL}/api/orders/list?status=AWAITING_PAYMENT`);
    const draftListData = await draftListRes.json();
    const foundInDraftList = draftListData.orders.some(
      (o) => o.id === draftData.internalOrderId || o.orderNumber === draftData.orderNumber
    );

    if (!foundInDraftList) {
      throw new Error('FAIL: Draft order was not found in status=AWAITING_PAYMENT list!');
    }
    console.log('Draft order correctly present in status=AWAITING_PAYMENT query.');
    console.log('✅ TEST 2 PASSED: Orders & Dispatch strictly excludes uncompleted / cancelled checkouts.\n');

    // TEST 3: Verify Analytics & Reporting captures abandoned checkout with WhatsApp recovery
    console.log('TEST 3: Verifying Analytics (/api/analytics) captures funnel drop-off and WhatsApp recovery...');
    const analyticsRes = await fetch(`${BASE_URL}/api/analytics`);
    const analyticsData = await analyticsRes.json();

    if (!analyticsData.success) {
      throw new Error(`Failed to fetch analytics: ${analyticsData.error}`);
    }

    console.log('Analytics Funnel Metrics:', analyticsData.funnel);
    console.log('Analytics Summary (Gross Revenue & Paid Orders):', analyticsData.summary);

    if (!analyticsData.funnel || analyticsData.funnel.abandonedCount < 1) {
      throw new Error('FAIL: Funnel metrics did not capture the abandoned checkout attempt!');
    }

    const abandonedRecord = (analyticsData.abandonedCheckouts || []).find(
      (o) => o.id === draftData.internalOrderId || o.orderNumber === draftData.orderNumber
    );

    if (!abandonedRecord) {
      throw new Error('FAIL: Draft order not found in analytics abandonedCheckouts array!');
    }

    console.log('Found Abandoned Checkout Record in Analytics:', {
      orderNumber: abandonedRecord.orderNumber,
      customerName: abandonedRecord.customerName,
      customerPhone: abandonedRecord.customerPhone,
      total: abandonedRecord.total,
      whatsappUrl: abandonedRecord.whatsappUrl,
    });

    if (!abandonedRecord.whatsappUrl || !abandonedRecord.whatsappUrl.includes('wa.me/919822987654')) {
      throw new Error('FAIL: Missing or invalid pre-formatted WhatsApp recovery link!');
    }
    console.log('✅ TEST 3 PASSED: Analytics properly reports checkout drop-offs with 1-click WhatsApp recovery.\n');

    // TEST 4: Verifying Cash on Delivery (COD) rejection
    console.log('TEST 4: Verifying Cash on Delivery (COD) rejection across the API...');
    const codRes = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outletSlug: 'cycle-circle',
        paymentMethod: 'COD',
        customer: {
          name: 'Test Customer',
          phone: '9822112233',
          address: 'Nashik',
        },
        items: [{ itemId: 'item-1', name: 'Puff', price: 50, quantity: 1, total: 50 }],
        total: 50,
      }),
    });

    const codData = await codRes.json();
    console.log('COD Order Attempt Response:', {
      status: codRes.status,
      success: codData.success,
      message: codData.message,
    });

    if (codRes.status !== 400 || codData.success !== false) {
      throw new Error('FAIL: Server accepted COD order when COD must be rejected!');
    }
    console.log('✅ TEST 4 PASSED: Cash on Delivery is strictly rejected.\n');

    console.log('=================================================================');
    console.log('🎉 ALL 4 CHECKOUT FILTERING, ABANDONMENT & COD TESTS PASSED!');
    console.log('=================================================================');
  } finally {
    // Always restore strict Live Production Mode
    await fetch(`${BASE_URL}/api/payments/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testMode: false }),
    });
    console.log('🔒 Re-locked into strict Live Production Mode.');
  }
}

runCheckoutFilteringTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
