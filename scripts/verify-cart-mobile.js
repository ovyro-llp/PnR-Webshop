const puppeteer = require('puppeteer');
const path = require('path');

const OUTPUT_DIR = '/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots';

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

  await page.goto('http://localhost:3000/college-road/college-special', { waitUntil: 'networkidle2' });

  // Click on the first Add button
  const addButtons = await page.$$('button');
  for (const btn of addButtons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Add') || text.includes('ADD')) {
      await btn.click();
      break;
    }
  }

  // Open the bag
  await page.waitForSelector('button');
  const bagButton = await page.$('button[aria-label="Bag"], header button:last-child');
  if (bagButton) {
    await bagButton.click();
  }

  await new Promise(r => setTimeout(r, 600));

  const screenshotPath = path.join(OUTPUT_DIR, 'cart-drawer-mobile.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Cart drawer screenshot saved.');

  await browser.close();
}

run().catch(console.error);
