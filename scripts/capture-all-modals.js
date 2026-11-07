const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOT_DIR = path.resolve('/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Open Location Modal directly by clicking "Choose Outlet / Location" in hero
    console.log('Opening location modal...');
    const changeLocBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Choose Outlet'));
    });
    if (changeLocBtn.asElement()) {
      await changeLocBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 1500));

      const shotModal = path.join(SCREENSHOT_DIR, '05-location-modal-no-locality.png');
      await page.screenshot({ path: shotModal });
      console.log('Saved 05-location-modal-no-locality.png');
    }

    // Switch tab to "Choose Bakery Outlet" tab in modal
    const outletTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Choose Bakery Outlet'));
    });
    if (outletTab.asElement()) {
      await outletTab.asElement().click();
      await new Promise((r) => setTimeout(r, 800));

      const shotOutlets = path.join(SCREENSHOT_DIR, '05b-location-modal-outlet-selection.png');
      await page.screenshot({ path: shotOutlets });
      console.log('Saved 05b-location-modal-outlet-selection.png');
    }

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close location selector"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // Now test mobile view (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click Hamburger
    const hamburger = await page.$('button[aria-label="Open Mobile Menu"]');
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 800));
      const shotMobile = path.join(SCREENSHOT_DIR, '04-mobile-menu-drawer.png');
      await page.screenshot({ path: shotMobile });
      console.log('Saved 04-mobile-menu-drawer.png');
    }

    // Now open Cart Drawer on mobile to verify no locality in cart
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click Add
    const addBtnMobile = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.trim() === 'Add');
    });
    if (addBtnMobile.asElement()) {
      await addBtnMobile.asElement().click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // Open Cart Drawer
    const bagBtnMobile = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Bag'));
    });
    if (bagBtnMobile.asElement()) {
      await bagBtnMobile.asElement().click();
      await new Promise((r) => setTimeout(r, 1200));

      const shotCartMobile = path.join(SCREENSHOT_DIR, '06b-mobile-cart-drawer.png');
      await page.screenshot({ path: shotCartMobile, fullPage: false });
      console.log('Saved 06b-mobile-cart-drawer.png');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
