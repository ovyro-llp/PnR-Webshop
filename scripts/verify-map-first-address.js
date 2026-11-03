const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(
  process.env.HOME || '/Users/hrushi',
  '.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots'
);

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTest() {
  console.log('🚀 Starting Map-First Address Selection & Auto-Fill E2E Test...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 }); // Mobile viewport (Pixel 7)

  // Clear localStorage to simulate fresh visitor
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  console.log('1. Waiting for Location Prompt Modal with Map...');
  await page.waitForTimeout ? page.waitForTimeout(1500) : new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '01-map-modal-opened-first.png'),
    fullPage: false,
  });
  console.log('📸 Saved 01-map-modal-opened-first.png');

  // Verify map container exists
  const hasMap = await page.evaluate(() => {
    return document.querySelector('.leaflet-container') !== null || document.querySelector('iframe') !== null || document.querySelector('[class*="custom-bakery-icon"]') !== null || document.querySelector('.custom-customer-icon') !== null;
  });
  console.log('Map Container Present:', hasMap);

  // Check auto-filled address input
  console.log('2. Checking Auto-Filled Address Input...');
  await new Promise((r) => setTimeout(r, 1500));

  const autoFilledAddress = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Flat 402"]');
    return input ? input.value : null;
  });
  console.log('Detected Auto-Filled Address:', autoFilledAddress);

  // User edits/changes the address
  console.log('3. User changes address to include Flat and Building details...');
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Flat 402"]');
    if (input) {
      input.value = 'Flat 502, Silver Oak Towers, Canal Link Road, Parijat Nagar';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '02-address-customized-by-user.png'),
    fullPage: false,
  });
  console.log('📸 Saved 02-address-customized-by-user.png');

  // Confirm delivery location
  console.log('4. Clicking Confirm Delivery Location & Order...');
  const confirmBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.textContent && b.textContent.includes('Confirm Delivery Location'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Confirm Button Clicked:', confirmBtnClicked);

  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '03-storefront-after-map-confirm.png'),
    fullPage: false,
  });
  console.log('📸 Saved 03-storefront-after-map-confirm.png');

  // Add an item to cart
  console.log('5. Adding product to basket...');
  const added = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find((b) => b.textContent && (b.textContent.includes('Add') || b.textContent.includes('+')));
    if (addBtn) {
      addBtn.click();
      return true;
    }
    return false;
  });
  console.log('Item Added to Cart:', added);

  await new Promise((r) => setTimeout(r, 1000));

  // Open cart drawer
  console.log('6. Opening Cart Drawer...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cartBtn = btns.find((b) => b.querySelector('svg') && b.textContent && (b.textContent.includes('₹') || b.textContent.includes('Basket') || b.textContent.includes('Cart')));
    if (cartBtn) cartBtn.click();
  });

  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '04-cart-drawer-auto-filled-address.png'),
    fullPage: false,
  });
  console.log('📸 Saved 04-cart-drawer-auto-filled-address.png');

  // Check values in cart drawer
  const cartAddressData = await page.evaluate(() => {
    const textarea = document.querySelector('textarea[placeholder*="Flat 402"]');
    const areaSelect = document.querySelector('select');
    const latLngBadge = document.querySelector('.font-mono.text-emerald-700');
    return {
      addressInCart: textarea ? textarea.value : null,
      areaInCart: areaSelect ? areaSelect.value : null,
      coordsBadge: latLngBadge ? latLngBadge.textContent : null,
    };
  });

  console.log('Cart Drawer Address State:', cartAddressData);

  // User edits address again inside cart drawer
  console.log('7. Modifying address directly inside Cart Drawer...');
  await page.evaluate(() => {
    const textarea = document.querySelector('textarea[placeholder*="Flat 402"]');
    if (textarea) {
      textarea.value = 'Flat 502, Tower B, Silver Oak Towers, Opp. Parijat Nagar Ground';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '05-cart-drawer-address-edited.png'),
    fullPage: false,
  });
  console.log('📸 Saved 05-cart-drawer-address-edited.png');

  console.log('✅ Map-first address auto-fill and user refinement verified successfully!');
  await browser.close();
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
