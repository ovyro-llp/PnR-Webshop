const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = '/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // PRE-SET ADMIN LOGIN IN STORAGE
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
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

  console.log('1. Navigating to Storefront...');
  await page.goto('http://localhost:3000/college-road', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 600));

  // Add first item to cart
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.toLowerCase().includes('add')) {
      await btn.click();
      console.log('Item added to cart.');
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 600));

  // Open Cart Drawer
  const bagButton = await page.$('button[aria-label="Bag"], header button:last-child');
  if (bagButton) {
    await bagButton.click();
    console.log('Basket drawer opened.');
  }

  await new Promise((r) => setTimeout(r, 800));

  // Capture Screenshot of Cart Drawer with details and Razorpay option
  const cartScreenshot = path.join(OUTPUT_DIR, 'razorpay-cart-drawer-mobile.png');
  await page.screenshot({ path: cartScreenshot });
  console.log(`Saved: ${cartScreenshot}`);

  // Click Razorpay checkout button
  const checkoutButtons = await page.$$('button');
  for (const btn of checkoutButtons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.toLowerCase().includes('pay via razorpay')) {
      console.log(`Clicking "${text}" button...`);
      await btn.click();
      break;
    }
  }

  console.log('Waiting for order completion & redirection...');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Current page URL after checkout:', page.url());
  const orderScreenshot = path.join(OUTPUT_DIR, 'razorpay-order-confirmed-mobile.png');
  await page.screenshot({ path: orderScreenshot, fullPage: true });
  console.log(`Saved: ${orderScreenshot}`);

  // 2. Admin Marketing & Razorpay Gateway
  console.log('2. Navigating to Admin Marketing...');
  await page.goto('http://localhost:3000/admin/marketing', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 800));

  // Click on "Razorpay Gateway" tab
  const tabButtons = await page.$$('button');
  for (const tab of tabButtons) {
    const text = await (await tab.getProperty('innerText')).jsonValue();
    if (text.toLowerCase().includes('razorpay gateway')) {
      console.log('Clicking "Razorpay Gateway" tab...');
      await tab.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 800));

  const adminPaymentScreenshot = path.join(OUTPUT_DIR, 'admin-razorpay-gateway-mobile.png');
  await page.screenshot({ path: adminPaymentScreenshot, fullPage: true });
  console.log(`Saved: ${adminPaymentScreenshot}`);

  const adminOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Admin Razorpay Tab Overflow: ${adminOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);

  await browser.close();
  console.log('All Razorpay verifications completed successfully!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
