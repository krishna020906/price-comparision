export const runtime = 'nodejs';
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// puppeteer.use(StealthPlugin());

import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function scrapeAmazon(searchTerm) {
  if (!searchTerm) throw new Error('Missing searchTerm');

  const url = `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}&s=relevanceblender`;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
      // '--disable-gpu',
      // '--single-process',
      // '--enable-features=NetworkService',
      // '--disable-blink-features=AutomationControlled'
    ],

  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-IN,en;q=0.9'
  });
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // use domcontentloaded so we don't wait for every resource/third-party asset
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
  } catch (e) {
    console.warn('⚠️ Amazon goto failed — capturing artifacts', e.message);
    try { await page.screenshot({ path: `amazon-goto-fail-${Date.now()}.png`, fullPage: true }); } catch {}
    const html = await page.content();
    require('fs').writeFileSync(`amazon-goto-fail-${Date.now()}.html`, html);
    await browser.close();
    throw e;
  }

  // then wait explicitly for the results container
  await page.waitForSelector('[data-cel-widget^="MAIN-SEARCH_RESULTS-"]', { timeout: 30000 });
  // const selector = '[data-cel-widget^="MAIN-SEARCH_RESULTS-"]';
   // try the data-cel-widget cards, or fallback to the main results slot
  const selector =
  '[data-cel-widget^="MAIN-SEARCH_RESULTS-"], div.s-main-slot';

  // // give the page time to fully render lazy assets
  // await page.waitForSelector(selector, { timeout: 15000 });
  // // on timeout, capture a debug screenshot
  // // (wrap in try/catch around waitForSelector)
  // try {
  //   await page.waitForSelector(selector, { timeout: 15000 });
  // } catch (e) {
  //   await page.screenshot({ path: `amazon-debug-${Date.now()}.png` });
  //   throw e;
  // }

   // wait for either the usual cards or the fallback container
  try {
    await page.waitForSelector(selector, { timeout: 15000 });
  } catch (e) {
    console.warn('⚠️ Amazon selector timeout—saving debug artifacts');
    // save screenshot & HTML for inspection
    await page.screenshot({ path: `amazon-debug-${Date.now()}.png` });
    const html = await page.content();
    require('fs').writeFileSync(`amazon-debug-${Date.now()}.html`, html);
    throw e;
  }


  
  const products = await page.evaluate((sel, term) => {
    const cards = document.querySelectorAll(sel);
    const results = [];
    for (let card of cards) {
      // title
      const titleEl = card.querySelector('h2 span');
      const title   = titleEl?.textContent?.trim() || '';
      const titleTokens = title.toLowerCase().split(/\s+/);
      const termTokens = term.toLowerCase().split(/\s+/);
      const overlap = termTokens.filter(t => titleTokens.includes(t)).length;
      if (overlap < Math.ceil(termTokens.length / 2)) continue;


      // link
      const linkAnchor = card.querySelector('h2')?.closest('a');
      const link = linkAnchor
        ? new URL(linkAnchor.getAttribute('href'), 'https://www.amazon.in').toString()
        : null;
      if (!link) continue;

      // image
      const imgEl = card.querySelector('img.s-image');
      const image = imgEl?.src || null;

      // price
      const whole    = card.querySelector('.a-price-whole')?.textContent.replace(/\D/g,'') || '';
      const fraction = card.querySelector('.a-price-fraction')?.textContent.replace(/\D/g,'') || '';
      const price    = whole ? parseFloat(whole + fraction) : null;
      if (price === null) continue;

      // asin
      const asinMatch = link.match(/\/dp\/([A-Z0-9]{10})/);
      const asin      = asinMatch?.[1] || null;

      results.push({ title, link, image, price, asin });

      if (results.length >= 6) break;
    }
    return results;
  }, selector, searchTerm.toLowerCase());
  
  await browser.close();

  products.sort((a, b) => a.price - b.price);
  return products;
}





/*export const runtime = 'nodejs';
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// puppeteer.use(StealthPlugin());

import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function scrapeAmazon(searchTerm) {
  if (!searchTerm) throw new Error('Missing searchTerm');

  const url = `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}&s=relevanceblender`;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
      // '--disable-gpu',
      // '--single-process',
      // '--enable-features=NetworkService',
      // '--disable-blink-features=AutomationControlled'
    ],

  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  );
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  // then wait explicitly for the results container
  await page.waitForSelector('[data-cel-widget^="MAIN-SEARCH_RESULTS-"]', { timeout: 30000 });
  // const selector = '[data-cel-widget^="MAIN-SEARCH_RESULTS-"]';
   // try the data-cel-widget cards, or fallback to the main results slot
  const selector =
  '[data-cel-widget^="MAIN-SEARCH_RESULTS-"], div.s-main-slot';

  // // give the page time to fully render lazy assets
  // await page.waitForSelector(selector, { timeout: 15000 });
  // // on timeout, capture a debug screenshot
  // // (wrap in try/catch around waitForSelector)
  // try {
  //   await page.waitForSelector(selector, { timeout: 15000 });
  // } catch (e) {
  //   await page.screenshot({ path: `amazon-debug-${Date.now()}.png` });
  //   throw e;
  // }

   // wait for either the usual cards or the fallback container
  try {
    await page.waitForSelector(selector, { timeout: 15000 });
  } catch (e) {
    console.warn('⚠️ Amazon selector timeout—saving debug artifacts');
    // save screenshot & HTML for inspection
    await page.screenshot({ path: `amazon-debug-${Date.now()}.png` });
    const html = await page.content();
    require('fs').writeFileSync(`amazon-debug-${Date.now()}.html`, html);
    throw e;
  }


    const products = await page.evaluate((sel, term) => {
    // helper: normalize/upgrade common Amazon size tokens in a URL
    function normalizeAmazonUrl(url) {
      if (!url) return null;
      // remove query params (we'll keep base url)
      const qIdx = url.indexOf('?');
      if (qIdx !== -1) url = url.slice(0, qIdx);

      // if protocol-relative //... -> add https:
      if (url.startsWith('//')) url = 'https:' + url;

      // common pattern: remove occurrences like ._SX38_ or ._AC_UL320_ (they are size tokens)
      // this tries to strip tokens of the form ._SOMETHING_ or _SOMETHING_ that appear before the file extension
      url = url.replace(/\._[A-Za-z0-9,_-]+_/g, '');

      // if the url still contains _SX<digits>_, try to replace with a larger one
      url = url.replace(/_SX(\d+)_/i, '_SX679_');

      // some URLs embed size like -_SL150_. try replacing to higher resolution if present
      url = url.replace(/_SL(\d+)_/i, '_SL1500_');
      url = url.replace(/_UX(\d+)_/i, '_UX1024_');

      // cleanup double underscores or multiple dots introduced by replace
      url = url.replace(/__+/g, '__');
      url = url.replace(/\/\./g, '/');

      return url;
    }

    // helper: pick best candidate from srcset string
    function pickFromSrcset(srcset) {
      if (!srcset) return null;
      // srcset format: "url1 80w, url2 160w, url3 320w"
      const parts = srcset.split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.length) return null;
      // choose the last (largest) URL part
      const last = parts[parts.length - 1];
      const url = last.split(/\s+/)[0];
      return normalizeAmazonUrl(url) || url;
    }

    // main extraction
    const cards = Array.from(document.querySelectorAll(sel));
    const results = [];

    for (let card of cards) {
      // title / relevance check (same as you had)
      const titleEl = card.querySelector('h2 span');
      const title = titleEl?.textContent?.trim() || '';
      const titleTokens = title.toLowerCase().split(/\s+/);
      const termTokens = term.toLowerCase().split(/\s+/);
      const overlap = termTokens.filter(t => titleTokens.includes(t)).length;
      if (overlap < Math.ceil(termTokens.length / 2)) continue;

      // link
      const linkAnchor = card.querySelector('h2')?.closest('a');
      const link = linkAnchor ? new URL(linkAnchor.getAttribute('href'), 'https://www.amazon.in').toString() : null;
      if (!link) continue;

      // NEW: image resolution logic
      const imgEl = card.querySelector('img.s-image');
      let image = null;

      // 1) prefer srcset (largest)
      const srcset = imgEl?.getAttribute('srcset') || imgEl?.getAttribute('data-srcset');
      if (srcset) image = pickFromSrcset(srcset);

      // 2) other common attributes (data-old-hires, data-src, data-hires, data-image)
      if (!image) {
        const candidates = [
          imgEl?.getAttribute('data-old-hires'),
          imgEl?.getAttribute('data-hires'),
          imgEl?.getAttribute('data-src'),
          imgEl?.getAttribute('data-image-lazy-src'),
          imgEl?.getAttribute('data-a-dynamic-image') ? (() => {
            // data-a-dynamic-image is JSON mapping urls -> [w,h]; parse and pick largest key
            try {
              const json = JSON.parse(imgEl.getAttribute('data-a-dynamic-image'));
              const keys = Object.keys(json || {});
              if (keys.length) return keys[keys.length - 1];
            } catch (e) {}
            return null;
          })() : null,
          imgEl?.src,
        ];
        for (const c of candidates) {
          if (!c) continue;
          // if candidate is a JSON string from data-a-dynamic-image, handle above; else normalize
          image = normalizeAmazonUrl(c) || c;
          if (image) break;
        }
      }

      // 3) final fallback: if image is still small-looking, attempt to repair common tokens
      if (image && /_SX\d+_|_SL\d+_|_UX\d+_|_AC_/.test(image)) {
        image = normalizeAmazonUrl(image);
      }

      // price (same approach)
      const whole = card.querySelector('.a-price-whole')?.textContent.replace(/\D/g,'') || '';
      const fraction = card.querySelector('.a-price-fraction')?.textContent.replace(/\D/g,'') || '';
      const price = whole ? parseFloat(whole + fraction) : null;
      if (price === null) continue;

      // asin
      const asinMatch = link.match(/\/dp\/([A-Z0-9]{10})/);
      const asin = asinMatch?.[1] || null;

      results.push({ title, link, image, price, asin });
      if (results.length >= 6) break;
    }

    return results;
  }, selector, searchTerm.toLowerCase());



  
  // const products = await page.evaluate((sel, term) => {
  //   const cards = document.querySelectorAll(sel);
  //   const results = [];
  //   for (let card of cards) {
  //     // title
  //     const titleEl = card.querySelector('h2 span');
  //     const title   = titleEl?.textContent?.trim() || '';
  //     const titleTokens = title.toLowerCase().split(/\s+/);
  //     const termTokens = term.toLowerCase().split(/\s+/);
  //     const overlap = termTokens.filter(t => titleTokens.includes(t)).length;
  //     if (overlap < Math.ceil(termTokens.length / 2)) continue;


  //     // link
  //     const linkAnchor = card.querySelector('h2')?.closest('a');
  //     const link = linkAnchor
  //       ? new URL(linkAnchor.getAttribute('href'), 'https://www.amazon.in').toString()
  //       : null;
  //     if (!link) continue;

  //     // image
  //     const imgEl = card.querySelector('img.s-image');
  //     const image = imgEl?.src || null;

  //     // price
  //     const whole    = card.querySelector('.a-price-whole')?.textContent.replace(/\D/g,'') || '';
  //     const fraction = card.querySelector('.a-price-fraction')?.textContent.replace(/\D/g,'') || '';
  //     const price    = whole ? parseFloat(whole + fraction) : null;
  //     if (price === null) continue;

  //     // asin
  //     const asinMatch = link.match(/\/dp\/([A-Z0-9]{10})/);
  //     const asin      = asinMatch?.[1] || null;

  //     results.push({ title, link, image, price, asin });

  //     if (results.length >= 6) break;
  //   }
  //   return results;
  // }, selector, searchTerm.toLowerCase());
  
  await browser.close();

  products.sort((a, b) => a.price - b.price);
  return products;
} */
