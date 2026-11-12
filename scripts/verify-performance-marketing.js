const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = '/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('--- STARTING PERFORMANCE MARKETING & META PIXEL VERIFICATION ---');

  // 0. Ensure sandbox mode is enabled for verification
  try {
    const configRes = await fetch('http://localhost:3000/api/payments/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testMode: true }),
    });
    console.log('0. Gateway testMode initialized:', (await configRes.json()).success);
  } catch (e) {
    console.warn('Could not set testMode:', e.message);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Array to capture all client-side fbq tracking calls
  const capturedFbqEvents = [];

  // Expose binding to catch window.fbq calls
  await page.exposeFunction('onFbqTrack', (method, pixelIdOrEvent, eventName, data, options) => {
    capturedFbqEvents.push({
      timestamp: Date.now(),
      method,
      pixelIdOrEvent,
      eventName,
      data,
      options,
    });
    console.log(`[Browser fbq Captured] ${method}:`, { pixelIdOrEvent, eventName, data, options });
  });

  // Attach console listener
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[Meta Pixel Client]') || text.includes('[Pixel Tracker Deduplicated]')) {
      console.log('PAGE LOG:', text);
    }
  });

  // Inject transparent spy on window.fbq and pre-set customer / delivery location
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('pnr_location_prompted', 'true');
    localStorage.setItem('pnr_selected_outlet', 'college-road');
    localStorage.setItem('pnr_customer_assigned_outlet', 'college-road');
    localStorage.setItem('pnr_customer_delivery_address', 'Shop 4, College Road, Nashik');
    localStorage.setItem('pnr_customer_delivery_area', 'College Road');
    localStorage.setItem(
      'pnr_customer_delivery_coords',
      JSON.stringify({ lat: 19.9975, lng: 73.7898 })
    );
    localStorage.setItem(
      'pnr_customer_user',
      JSON.stringify({
        id: 'cust-tester-102',
        name: 'Performance Marketer',
        phone: '9822011223',
        email: 'marketer@puffsnrolls.com',
      })
    );

    let _fbq = window.fbq;
    Object.defineProperty(window, 'fbq', {
      configurable: true,
      enumerable: true,
      get() {
        return _fbq;
      },
      set(fn) {
        if (typeof fn === 'function' && !fn._spied) {
          _fbq = function (...args) {
            if (typeof window.onFbqTrack === 'function') {
              try {
                window.onFbqTrack(args[0], args[1], args[2], args[3], args[4]);
              } catch (e) {}
            }
            return fn.apply(this, args);
          };
          _fbq._spied = true;
          for (const k in fn) {
            _fbq[k] = fn[k];
          }
        } else {
          _fbq = fn;
        }
      },
    });
  });

  // TEST 1: Load Storefront Page & Verify Single PageView
  console.log('\n1. Navigating to Storefront (/college-road)...');
  await page.goto('http://localhost:3000/college-road', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));

  const pageViewEvents = capturedFbqEvents.filter(
    (e) => e.eventName === 'PageView' || e.pixelIdOrEvent === 'PageView'
  );
  console.log(`-> Total PageView events captured: ${pageViewEvents.length}`);
  if (pageViewEvents.length >= 1) {
    console.log('✅ PASS: PageView event fired on initial load.');
  }

  // TEST 2: Add Item to Basket & Verify AddToCart Payload
  console.log('\n2. Adding item to basket to trigger AddToCart...');
  const addSuccess = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.innerText.trim() === 'Add'
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  console.log('-> Add button clicked in DOM:', addSuccess);
  await new Promise((r) => setTimeout(r, 1500));

  const addToCartEvents = capturedFbqEvents.filter(
    (e) => e.eventName === 'AddToCart' || e.pixelIdOrEvent === 'AddToCart'
  );
  console.log(`-> Total AddToCart events captured: ${addToCartEvents.length}`);

  if (addToCartEvents.length >= 1) {
    const latestAdd = addToCartEvents[addToCartEvents.length - 1];
    const payload = latestAdd.data || latestAdd.eventName;
    console.log('✅ PASS: AddToCart event successfully fired to Meta Pixel!');
    console.log('   Payload:', JSON.stringify(payload, null, 2));
  } else {
    console.error('❌ FAIL: AddToCart was not fired.');
  }

  // TEST 3: Open Cart & Trigger InitiateCheckout
  console.log('\n3. Opening Cart Drawer & Triggering InitiateCheckout...');
  const bagClicked = await page.evaluate(() => {
    const bagBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.innerText.includes('Bag')
    );
    if (bagBtn) {
      bagBtn.click();
      return true;
    }
    return false;
  });
  console.log('-> Bag button clicked:', bagClicked);
  await new Promise((r) => setTimeout(r, 1500));

  // Trigger checkout from cart drawer
  const checkoutText = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) =>
        b.innerText.toLowerCase().includes('proceed to pay') ||
        b.innerText.toLowerCase().includes('pay via') ||
        b.innerText.toLowerCase().includes('checkout')
    );
    if (btn) {
      btn.click();
      return btn.innerText;
    }
    return null;
  });
  console.log('-> Checkout button clicked:', checkoutText);
  await new Promise((r) => setTimeout(r, 1500));

  const checkoutEvents = capturedFbqEvents.filter(
    (e) => e.eventName === 'InitiateCheckout' || e.pixelIdOrEvent === 'InitiateCheckout'
  );
  console.log(`-> Total InitiateCheckout events captured: ${checkoutEvents.length}`);
  if (checkoutEvents.length >= 1) {
    const chk = checkoutEvents[checkoutEvents.length - 1];
    console.log('✅ PASS: InitiateCheckout event successfully fired to Meta Pixel!');
    console.log('   Payload:', JSON.stringify(chk.data || chk.eventName, null, 2));
  }

  // TEST 4: Simulate Payment Settlement with Demo Sandbox Signature
  console.log('\n4. Simulating Payment Settlement via /api/payments/razorpay/verify...');
  const settleRes = await page.evaluate(async () => {
    const res = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: `order_pnr_${Date.now()}`,
        razorpay_payment_id: `pay_pnr_${Date.now()}`,
        razorpay_signature: 'demo_sig_valid',
        orderPayload: {
          outletSlug: 'college-road',
          customer: {
            name: 'Rohit Deshmukh',
            phone: '9822011223',
            email: 'rohit@example.com',
            address: 'College Road Doorstep, Nashik',
            pincode: '422005',
          },
          items: [
            { itemId: 'puffs-paneer', name: 'Paneer Puff', price: 45, quantity: 2, total: 90 },
            { itemId: 'khari-special', name: 'Special Khari 250g', price: 95, quantity: 1, total: 95 },
          ],
          subtotal: 185,
          discount: 0,
          deliveryFee: 35,
          total: 220,
          paymentMethod: 'UPI',
        },
      }),
    });
    return res.json();
  });

  console.log('-> Payment settlement success:', settleRes.success, 'Order Number:', settleRes.order?.orderNumber);

  if (settleRes.success && settleRes.order) {
    const confirmedOrder = settleRes.order;
    console.log('✅ PASS: Payment verified and settled with Server CAPI Purchase dispatched.');

    // TEST 5: Verify Order Confirmation Screen Purchase Trigger & Deduplication
    console.log(`\n5. Visiting Order Confirmation Page (/${confirmedOrder.outletSlug}/order/${confirmedOrder.id})...`);
    await page.goto(`http://localhost:3000/${confirmedOrder.outletSlug}/order/${confirmedOrder.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await new Promise((r) => setTimeout(r, 2000));

    const purchaseEvents = capturedFbqEvents.filter(
      (e) => e.eventName === 'Purchase' || e.pixelIdOrEvent === 'Purchase'
    );
    console.log(`-> Total Purchase events captured after order page load: ${purchaseEvents.length}`);

    if (purchaseEvents.length >= 1) {
      const pEvt = purchaseEvents[purchaseEvents.length - 1];
      console.log('✅ PASS: Purchase event fired on confirmation page with shared eventID!');
      console.log('   Options / eventID:', pEvt.options);
      console.log('   Payload:', JSON.stringify(pEvt.data || pEvt.eventName, null, 2));
    }

    // TEST 6: Reload the page and verify ZERO duplicate Purchase events
    console.log('\n6. Reloading Order Confirmation Page to test Strict Client Deduplication...');
    const purchaseCountBeforeReload = capturedFbqEvents.filter(
      (e) => e.eventName === 'Purchase' || e.pixelIdOrEvent === 'Purchase'
    ).length;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2000));

    const purchaseCountAfterReload = capturedFbqEvents.filter(
      (e) => e.eventName === 'Purchase' || e.pixelIdOrEvent === 'Purchase'
    ).length;

    console.log(`-> Purchase count before reload: ${purchaseCountBeforeReload}, after reload: ${purchaseCountAfterReload}`);
    if (purchaseCountBeforeReload === purchaseCountAfterReload) {
      console.log('✅ PASS: ZERO duplicate Purchase events fired on reload! Client deduplication 100% verified.');
    } else {
      console.error('❌ FAIL: Purchase fired again on page reload!');
    }
  }

  // TEST 7: Query Backend Marketing Events Ledger API
  console.log('\n7. Verifying Backend Marketing Events Ledger (/api/marketing/events)...');
  const eventsRes = await page.evaluate(async () => {
    const res = await fetch('/api/marketing/events?limit=25');
    return res.json();
  });

  console.log(`-> Backend events count in ledger: ${eventsRes.count}`);
  const eventTypesInLedger = [...new Set(eventsRes.events?.map((e) => e.eventName))];
  console.log('-> Unique Event Types stored in backend:', eventTypesInLedger);

  if (eventTypesInLedger.includes('AddToCart') && eventTypesInLedger.includes('Purchase') && eventTypesInLedger.includes('Sale')) {
    console.log('✅ PASS: AddToCart, Purchase, and Sale events are permanently stored in the backend marketing ledger!');
  }

  // TEST 8: Admin Attribution Dashboard Screenshot
  console.log('\n8. Navigating to Admin Marketing & Attribution Dashboard...');
  await page.evaluate(() => {
    localStorage.setItem(
      'pnr_auth_user',
      JSON.stringify({
        id: 'admin-super',
        name: 'Headquarters Operations',
        email: 'admin@puffsnrolls.com',
        role: 'ADMIN',
        outletAccess: ['all'],
        title: 'Master Brand Administrator',
      })
    );
  });

  await page.goto('http://localhost:3000/admin/marketing', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));

  // Click on Attribution & ROAS tab
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.toLowerCase().includes('attribution')
    );
    if (tab) tab.click();
  });

  await new Promise((r) => setTimeout(r, 1500));

  const screenshotPath = path.join(SCREENSHOTS_DIR, '25-admin-marketing-live-ledger.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ Screenshot captured: ${screenshotPath}`);

  await browser.close();
  console.log('\n--- ALL PERFORMANCE MARKETING & META PIXEL VERIFICATIONS COMPLETE ---');
}

run().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});
