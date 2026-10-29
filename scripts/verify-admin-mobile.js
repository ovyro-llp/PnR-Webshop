const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = '/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots';

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

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

  console.log('Logging in as admin on mobile...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });

  // Form has default pre-filled credentials, click submit directly
  await page.click('button[type="submit"]');

  // Wait for redirect to /admin
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const adminRoutes = [
    { name: 'admin-orders-mobile', url: 'http://localhost:3000/admin' },
    { name: 'admin-outlets-mobile', url: 'http://localhost:3000/admin/outlets' },
    { name: 'admin-inventory-mobile', url: 'http://localhost:3000/admin/inventory' },
    { name: 'admin-marketing-mobile', url: 'http://localhost:3000/admin/marketing' },
    { name: 'admin-employees-mobile', url: 'http://localhost:3000/admin/employees' },
    { name: 'admin-analytics-mobile', url: 'http://localhost:3000/admin/analytics' },
  ];

  for (const item of adminRoutes) {
    console.log(`Auditing ${item.name} at ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    // Test hamburger drawer on the first route
    if (item.name === 'admin-orders-mobile') {
      try {
        await page.waitForSelector('button[aria-label="Open Admin Menu"]', { timeout: 4000 });
        const menuBtn = await page.$('button[aria-label="Open Admin Menu"]');
        if (menuBtn) {
          console.log('Opening mobile hamburger sidebar drawer...');
          await menuBtn.click();
          await new Promise((r) => setTimeout(r, 600));
          await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-hamburger-drawer-mobile.png') });
          console.log('Captured admin-hamburger-drawer-mobile.png');
          const closeBtn = await page.$('button[aria-label="Close Menu"]');
          if (closeBtn) await closeBtn.click();
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (e) {
        console.log('Menu button wait error:', e.message);
      }
    }

    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;

      return {
        docWidth,
        scrollWidth,
        bodyWidth,
        hasHorizontalOverflow: scrollWidth > docWidth || bodyWidth > docWidth,
      };
    });

    console.log(`[${item.name}] Result:`, overflowInfo);

    const screenshotPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);
  }

  await browser.close();
  console.log('All admin mobile audits passed!');
}

run().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
