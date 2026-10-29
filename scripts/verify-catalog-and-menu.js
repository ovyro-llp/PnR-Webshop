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

  // Pre-seed admin auth so admin views are authenticated
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

  // 1. Verify Customer Hamburger Menu
  console.log('1. Navigating to Customer Storefront on mobile...');
  await page.goto('http://localhost:3000/college-road', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 600));

  // Click customer hamburger button
  const menuBtn = await page.$('button[aria-label="Open Navigation Menu"]');
  if (menuBtn) {
    console.log('Clicking customer hamburger menu button...');
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    const customerDrawerShot = path.join(OUTPUT_DIR, 'customer-hamburger-menu-mobile.png');
    await page.screenshot({ path: customerDrawerShot });
    console.log(`Saved: ${customerDrawerShot}`);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Customer Drawer Overflow: ${hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);

    // Close customer drawer
    const closeBtn = await page.$('button[aria-label="Close Navigation"]');
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 2. Admin Inventory: Outlet Stock & "Assign from Master Catalog"
  console.log('2. Navigating to Admin Inventory & Catalog...');
  await page.goto('http://localhost:3000/admin/inventory', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 800));

  // Click "+ Assign from Master Catalog"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Assign from Master Catalog')) {
      console.log('Opening Assign from Master Catalog drawer...');
      await btn.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 600));

  const assignDrawerShot = path.join(OUTPUT_DIR, 'admin-assign-drawer-mobile.png');
  await page.screenshot({ path: assignDrawerShot });
  console.log(`Saved: ${assignDrawerShot}`);

  // Close assign drawer
  const closeAssignBtn = await page.$('button[class*="rounded-full"][class*="text-stone-400"]');
  if (closeAssignBtn) await closeAssignBtn.click();
  await new Promise((r) => setTimeout(r, 400));

  // 3. Switch to Central Master Catalog Tab
  console.log('3. Switching to Central Master Catalog tab...');
  const tabButtons = await page.$$('button');
  for (const btn of tabButtons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Master Catalog')) {
      await btn.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 600));

  const masterCatalogShot = path.join(OUTPUT_DIR, 'admin-master-catalog-mobile.png');
  await page.screenshot({ path: masterCatalogShot });
  console.log(`Saved: ${masterCatalogShot}`);

  // Click "+ Upload New Product"
  const uploadBtns = await page.$$('button');
  for (const btn of uploadBtns) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Upload New Product')) {
      console.log('Opening Upload New Product modal...');
      await btn.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 600));

  const uploadModalShot = path.join(OUTPUT_DIR, 'admin-upload-product-modal-mobile.png');
  await page.screenshot({ path: uploadModalShot });
  console.log(`Saved: ${uploadModalShot}`);

  // 4. Admin Universal Hamburger Drawer
  console.log('4. Testing Admin Universal Hamburger Menu...');
  const adminMenuBtn = await page.$('button[aria-label="Open Admin Menu"], header button:first-child');
  if (adminMenuBtn) {
    await adminMenuBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    const adminHamburgerShot = path.join(OUTPUT_DIR, 'admin-universal-hamburger-mobile.png');
    await page.screenshot({ path: adminHamburgerShot });
    console.log(`Saved: ${adminHamburgerShot}`);
  }

  await browser.close();
  console.log('All automated tests completed successfully!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
