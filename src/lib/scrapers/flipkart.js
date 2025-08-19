
// src/scrapers/flipkart.js
export const runtime = 'nodejs';
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// puppeteer.use(StealthPlugin());


import puppeteer from 'puppeteer';


/**
 * scrapeFlipkart:
 *   - Takes a searchTerm string
 *   - Returns up to 6 items of the form { price, rating }
 *   - Filters exact-match titles and limits results
 */
export async function scrapeFlipkart(searchTerm) {
  if (!searchTerm) throw new Error('Missing searchTerm');

  // Build search URL
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(searchTerm)}`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
      // '--disable-gpu',
      // '--single-process', 
      // '--enable-features=NetworkService'
    ],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // small pause so dynamic JS can run
  await new Promise(r => setTimeout(r, 2000));
    // right after your delay:
  try {
    // close the login modal if it’s there
    await page.click('button._2KpZ6l._2doB4z', { timeout: 5000 });
    // give the page a moment to reflow
    await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
    // if the modal never appeared, that’s fine
    console.log('No login popup to close');
  }


  // after page.goto(...)
  // debug screenshot to inspect what the page is showing
  try {
    await page.screenshot({
      path: `flipkart-debug-${Date.now()}.png`
    });
  } catch (e) {
    console.warn('⚠️ flipkart screenshot failed:', e.message);
  }


  const selector = 'div[data-id]';  // each product card wrapper
  // Wait until product cards appear
  try {
    await page.waitForSelector(selector, { timeout: 20000 });
  } catch (err) {
    console.warn('⚠️ Flipkart selector timeout, dumping HTML');
    const html = await page.content();
    require('fs').writeFileSync(`flipkart-debug-${Date.now()}.html`, html);
    throw err;
  }

  const products = await page.evaluate((sel, term) => {
    const cards = document.querySelectorAll(sel);
    const results = [];
    for (let card of cards) {
      // Extract title from image alt (class DByuf4 is still valid)
      const imgEl = card.querySelector('img.DByuf4');
      const title = imgEl?.alt?.trim() || '';
      if (!title.toLowerCase().includes(term.toLowerCase())) continue;

      // Flipkart now puts the current price in a div with only the "Nx9bqj" class
      const priceEl = card.querySelector('div.Nx9bqj')
      const priceText = priceEl?.textContent.replace(/\D/g, '') || '';
      const price = priceText ? parseFloat(priceText) : null;
      if (price === null) continue;

      // Ratings are still in the XQDdHH container
      const ratingEl = card.querySelector('div.XQDdHH');
      const rating = ratingEl?.textContent.trim() || null;

      results.push({ price, rating });
      if (results.length >= 6) break;
    }
    return results;
  }, selector, searchTerm);

  await browser.close();

  // Results are in relevance order already
  return products;
}
