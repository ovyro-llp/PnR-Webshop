const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runVerification() {
  console.log('🚀 Starting UI and Cloud Media Verification...');

  const screenshotsDir = '/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 1. Visit Login to hydrate admin credentials
  console.log('1. Setting up admin session...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem(
      'pnr_auth_user',
      JSON.stringify({
        id: 'admin-1',
        name: 'Corporate HQ Admin',
        phone: '+919876543210',
        role: 'ADMIN',
        outletSlug: 'college-road'
      })
    );
  });

  // 2. Visit Admin Inventory & Catalog
  console.log('2. Navigating to Admin Inventory & Catalog on mobile viewport (390px)...');
  await page.goto('http://localhost:3000/admin/inventory', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Check horizontal overflow
  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  console.log('Mobile Viewport Dimensions:', overflow);
  if (overflow.hasHorizontalScroll) {
    console.error('❌ Horizontal scroll detected!');
  } else {
    console.log('✅ ZERO Horizontal scroll detected on 390px mobile viewport!');
  }

  // 3. Capture Initial View with Non-Scrolling OutletSelector
  await page.screenshot({
    path: path.join(screenshotsDir, 'admin-outlet-selector-mobile.png'),
    fullPage: false
  });
  console.log('📸 Captured: admin-outlet-selector-mobile.png');

  // 4. Test Opening OutletSelector Dropdown
  console.log('3. Testing OutletSelector Dropdown...');
  const triggerSelector = 'button[aria-haspopup="listbox"]';
  await page.waitForSelector(triggerSelector);
  await page.click(triggerSelector);
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(screenshotsDir, 'admin-outlet-selector-dropdown-open.png'),
    fullPage: false
  });
  console.log('📸 Captured: admin-outlet-selector-dropdown-open.png');

  // Click an outlet in the dropdown (e.g. Nashik Road)
  const dropdownItems = await page.$$('div[role="listbox"] button');
  if (dropdownItems.length >= 2) {
    await dropdownItems[1].click();
    console.log('✅ Clicked second outlet in dropdown!');
    await new Promise(r => setTimeout(r, 800));
  }

  // 5. Test Cloud Media Tab
  console.log('4. Testing Cloud Media Tab...');
  const mediaTabBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.innerText.includes('Cloud Media') || b.innerText.includes('Media'));
  });

  if (mediaTabBtn && mediaTabBtn.asElement()) {
    await mediaTabBtn.asElement().click();
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-cloud-media-tab-mobile.png'),
      fullPage: false
    });
    console.log('📸 Captured: admin-cloud-media-tab-mobile.png');
  }

  // 6. Test Master Catalog Tab & Upload Modal
  console.log('5. Testing Master Catalog Tab & Product Modal...');
  const catalogTabBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.innerText.includes('Master Catalog'));
  });

  if (catalogTabBtn && catalogTabBtn.asElement()) {
    await catalogTabBtn.asElement().click();
    await new Promise(r => setTimeout(r, 1000));

    // Click "+ Upload New Product"
    const uploadProductBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Upload New Product'));
    });

    if (uploadProductBtn && uploadProductBtn.asElement()) {
      await uploadProductBtn.asElement().click();
      await new Promise(r => setTimeout(r, 800));

      await page.screenshot({
        path: path.join(screenshotsDir, 'admin-upload-modal-with-cloud-media.png'),
        fullPage: false
      });
      console.log('📸 Captured: admin-upload-modal-with-cloud-media.png');
    }
  }

  // 7. Test Analytics Page OutletSelector
  console.log('6. Testing Analytics Page OutletSelector...');
  await page.goto('http://localhost:3000/admin/analytics', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(screenshotsDir, 'admin-analytics-outlet-selector-mobile.png'),
    fullPage: false
  });
  console.log('📸 Captured: admin-analytics-outlet-selector-mobile.png');

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
