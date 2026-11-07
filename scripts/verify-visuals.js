const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve('/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Desktop Hero with Products
    const shot1 = path.join(SCREENSHOT_DIR, '01-desktop-hero-products.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log('Saved 01-desktop-hero-products.png');

    // 2. Click Veg Only Filter
    const vegBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Veg Only'));
    });
    if (vegBtn.asElement()) {
      await vegBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 800));
      const shot2 = path.join(SCREENSHOT_DIR, '02-desktop-veg-filter-active.png');
      await page.screenshot({ path: shot2, fullPage: false });
      console.log('Saved 02-desktop-veg-filter-active.png');
    }

    // 3. Click Non-Veg Only Filter
    const nonVegBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Non-Veg'));
    });
    if (nonVegBtn.asElement()) {
      await nonVegBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 800));
      const shot3 = path.join(SCREENSHOT_DIR, '03-desktop-nonveg-filter-active.png');
      await page.screenshot({ path: shot3, fullPage: false });
      console.log('Saved 03-desktop-nonveg-filter-active.png');
    }

    // Reset to All Items
    const allBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('All Items'));
    });
    if (allBtn.asElement()) {
      await allBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // 4. Test Mobile Drawer (Viewport: 390x844 - iPhone 14 / modern phone)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click Hamburger
    const hamburger = await page.$('button[aria-label="Open Mobile Menu"]');
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 800));
      const shot4 = path.join(SCREENSHOT_DIR, '04-mobile-menu-drawer.png');
      await page.screenshot({ path: shot4, fullPage: false });
      console.log('Saved 04-mobile-menu-drawer.png');

      // Click "Update Location" on the delivery location card
      const updateLocBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes('Update Location'));
      });
      if (updateLocBtn.asElement()) {
        await updateLocBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 1200));

        const shot5 = path.join(SCREENSHOT_DIR, '05-location-modal-no-locality.png');
        await page.screenshot({ path: shot5, fullPage: false });
        console.log('Saved 05-location-modal-no-locality.png');

        // Confirm Gangapur Road outlet selection
        const confirmBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find((b) => b.textContent && b.textContent.includes('Confirm'));
        });
        if (confirmBtn.asElement()) {
          await confirmBtn.asElement().click();
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    // 5. Add product to cart and open Cart Drawer to verify no locality and fulfilling outlet selector
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Add" on first product card
    const addBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.trim() === 'Add');
    });
    if (addBtn.asElement()) {
      await addBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // Open cart drawer
    const bagBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Bag'));
    });
    if (bagBtn.asElement()) {
      await bagBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 1000));

      const shot6 = path.join(SCREENSHOT_DIR, '06-cart-drawer-outlet-selector.png');
      await page.screenshot({ path: shot6, fullPage: false });
      console.log('Saved 06-cart-drawer-outlet-selector.png');
    }

    console.log('All visual tests captured successfully!');
  } catch (err) {
    console.error('Error in Puppeteer script:', err);
  } finally {
    await browser.close();
  }
}

run();
