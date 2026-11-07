const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOT_DIR = path.resolve('/Users/hrushi/.gemini/antigravity/brain/304a3096-334f-4c7b-a871-3196847cafad/screenshots');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    // Open location modal
    const openBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Choose Outlet'));
    });
    if (openBtn.asElement()) {
      await openBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 1800));

      // Take screenshot of the complete modal
      const shot1 = path.join(SCREENSHOT_DIR, '07-modal-single-confirm-button-auto-fill.png');
      await page.screenshot({ path: shot1 });
      console.log('Saved 07-modal-single-confirm-button-auto-fill.png');

      // Now switch the fulfilling kitchen to "Gangapur Road" manually
      await page.evaluate(() => {
        const select = document.querySelector('select');
        if (select) {
          select.value = 'gangapur-road';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 600));

      const shot2 = path.join(SCREENSHOT_DIR, '08-modal-gangapur-road-manual-choice.png');
      await page.screenshot({ path: shot2 });
      console.log('Saved 08-modal-gangapur-road-manual-choice.png');
    }

    console.log('Single-button modal verification complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
