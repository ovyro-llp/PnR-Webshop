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

  const urls = [
    { name: 'home-mobile', url: 'http://localhost:3000' },
    { name: 'campaign-mobile', url: 'http://localhost:3000/college-road/college-special' },
    { name: 'outlet-mobile', url: 'http://localhost:3000/college-road' },
    { name: 'login-mobile', url: 'http://localhost:3000/login' },
    { name: 'order-track-mobile', url: 'http://localhost:3000/college-road/order/ord-101' },
  ];

  for (const item of urls) {
    console.log(`Checking ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle2' });

    // Check horizontal scroll
    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      
      const overflowingElements = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 1) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id,
            className: el.className ? String(el.className).slice(0, 50) : '',
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      });

      return {
        docWidth,
        scrollWidth,
        bodyWidth,
        hasHorizontalOverflow: scrollWidth > docWidth || bodyWidth > docWidth,
        overflowCount: overflowingElements.length,
        overflowingElements: overflowingElements.slice(0, 5),
      };
    });

    console.log(`[${item.name}] Overflow:`, overflowInfo);

    const screenshotPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
